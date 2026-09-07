import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { API_METHODS, LEGACY_METHODS, resolveSettings } from '../profiles'
import type { WebMcpSettings } from '../types'
import {
  getConstInitializer,
  getKey,
  getVariable,
  isGlobal,
  unwrap,
} from './bindings'
import { readObject } from './static'
import type { ObjectFacts } from './static'

export interface ApiCall {
  node: TSESTree.CallExpression
  method: string
  receiver: 'document' | 'navigator' | 'wrapper'
  bound: boolean
  tool: ObjectFacts | undefined
  toolNode: TSESTree.Node | undefined
  options: ObjectFacts | undefined
}

export class ApiAnalyzer {
  public readonly settings: Required<WebMcpSettings>
  public readonly source: TSESLint.SourceCode
  private readonly calls = new WeakMap<
    TSESTree.CallExpression,
    ApiCall | null
  >()

  public constructor(source: TSESLint.SourceCode, settings: unknown) {
    this.source = source
    this.settings = resolveSettings(settings)
  }

  public getReceiver(
    node: TSESTree.Node,
    depth = 0,
  ): 'document' | 'navigator' | undefined {
    if (depth > 20) {
      return undefined
    }
    const expression = unwrap(node)
    if (expression.type === 'Identifier') {
      const initializer = getConstInitializer(
        this.source,
        expression,
        'receiver',
      )
      return initializer ? this.getReceiver(initializer, depth + 1) : undefined
    }
    if (
      expression.type !== 'MemberExpression' ||
      getKey(expression) !== 'modelContext'
    ) {
      return undefined
    }
    const owner = unwrap(expression.object)
    for (const name of ['document', 'navigator'] as const) {
      if (isGlobal(this.source, owner, name)) {
        return name
      }
      if (
        owner.type === 'MemberExpression' &&
        getKey(owner) === name &&
        (isGlobal(this.source, owner.object, 'window') ||
          isGlobal(this.source, owner.object, 'globalThis'))
      ) {
        return name
      }
    }
    return undefined
  }

  private getMethod(
    node: TSESTree.Node,
    depth = 0,
  ): Pick<ApiCall, 'method' | 'receiver' | 'bound'> | undefined {
    if (depth > 20) {
      return undefined
    }
    const expression = unwrap(node)
    if (expression.type === 'MemberExpression') {
      const receiver = this.getReceiver(expression.object)
      const method = getKey(expression)
      return receiver && method ? { receiver, method, bound: true } : undefined
    }
    if (expression.type === 'SequenceExpression') {
      const last = expression.expressions.at(-1)
      const method = last ? this.getMethod(last, depth + 1) : undefined
      return method ? { ...method, bound: false } : undefined
    }
    if (expression.type !== 'Identifier') {
      return undefined
    }
    const initializer = getConstInitializer(this.source, expression, 'method')
    if (initializer) {
      const method = this.getMethod(initializer, depth + 1)
      return method ? { ...method, bound: false } : undefined
    }
    const variable = getVariable(this.source, expression)
    if (
      variable?.defs.length !== 1 ||
      variable.references.some(
        reference => reference.isWrite() && !reference.init,
      )
    ) {
      return undefined
    }
    const [definition] = variable.defs
    if (
      definition?.type !== 'Variable' ||
      definition.parent.kind !== 'const' ||
      !definition.node.init ||
      definition.node.id.type !== 'ObjectPattern' ||
      definition.node.range[1] > node.range[0]
    ) {
      return undefined
    }
    const receiver = this.getReceiver(definition.node.init)
    if (!receiver) {
      return undefined
    }
    for (const property of definition.node.id.properties) {
      if (
        property.type === 'Property' &&
        property.value.type === 'Identifier' &&
        property.value.name === expression.name
      ) {
        const method = getKey(property)
        return method ? { receiver, method, bound: false } : undefined
      }
    }
    return undefined
  }

  private getWrapper(node: TSESTree.CallExpression): number | undefined {
    const callee = unwrap(node.callee)
    if (callee.type !== 'Identifier') {
      return undefined
    }
    const variable = getVariable(this.source, callee)
    const definition = variable?.defs[0]
    if (
      definition?.type !== 'ImportBinding' ||
      definition.node.type !== 'ImportSpecifier' ||
      definition.parent.type !== 'ImportDeclaration' ||
      definition.parent.importKind === 'type' ||
      definition.node.importKind === 'type'
    ) {
      return undefined
    }
    const imported =
      definition.node.imported.type === 'Identifier'
        ? definition.node.imported.name
        : definition.node.imported.value
    const moduleName = definition.parent.source.value
    return this.settings.wrappers.find(
      wrapper => wrapper.module === moduleName && wrapper.imported === imported,
    )?.toolArgument
  }

  public identify(node: TSESTree.CallExpression): ApiCall | undefined {
    const cached = this.calls.get(node)
    if (cached !== undefined) {
      return cached ?? undefined
    }
    const method = this.getMethod(node.callee)
    const wrapperIndex = method ? undefined : this.getWrapper(node)
    if (!method && wrapperIndex === undefined) {
      this.calls.set(node, null)
      return undefined
    }
    const descriptor = method ?? {
      method: 'definition',
      receiver: 'wrapper' as const,
      bound: true,
    }
    // Spreads shift all subsequent positional arguments.
    const argument = (index: number) =>
      node.arguments
        .slice(0, index + 1)
        .some(entry => entry.type === 'SpreadElement')
        ? undefined
        : node.arguments[index]
    const toolIndex =
      wrapperIndex ??
      (descriptor.method === 'registerTool' ||
      descriptor.method === 'executeTool'
        ? 0
        : -1)
    const toolNode = toolIndex >= 0 ? argument(toolIndex) : undefined
    const optionIndices: Record<string, number> = {
      registerTool: 1,
      getTools: 0,
      executeTool: 2,
    }
    const optionIndex = optionIndices[descriptor.method] ?? -1
    const result: ApiCall = {
      ...descriptor,
      node,
      toolNode,
      tool: readObject(this.source, toolNode),
      options:
        optionIndex >= 0
          ? readObject(this.source, argument(optionIndex))
          : undefined,
    }
    this.calls.set(node, result)
    return result
  }
}

const ANALYZERS = new WeakMap<TSESLint.SourceCode, Map<string, ApiAnalyzer>>()

export function getAnalyzer(
  source: TSESLint.SourceCode,
  settings: unknown,
): ApiAnalyzer {
  const resolved = resolveSettings(settings)
  const key = JSON.stringify(resolved)
  let analyzers = ANALYZERS.get(source)
  if (!analyzers) {
    analyzers = new Map()
    ANALYZERS.set(source, analyzers)
  }
  let analyzer = analyzers.get(key)
  if (!analyzer) {
    analyzer = new ApiAnalyzer(source, resolved)
    analyzers.set(key, analyzer)
  }
  return analyzer
}

export function isDefinition(call: ApiCall): boolean {
  return (
    call.bound &&
    ((call.receiver === 'document' && call.method === 'registerTool') ||
      call.receiver === 'wrapper')
  )
}

export function isNativeMethod(call: ApiCall): boolean {
  return (
    call.receiver !== 'wrapper' &&
    (API_METHODS.includes(call.method) || LEGACY_METHODS.includes(call.method))
  )
}
