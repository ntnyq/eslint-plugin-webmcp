import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import {
  ANALYSIS_MAX_DEPTH,
  API_OPTION_INDICES,
  LEGACY_METHODS,
} from '../../constants'
import type { ApiCall, WebMcpSettings, WebMcpTarget } from '../../types'
import { resolveSettings, supportsApiMethod } from '../settings'
import {
  getConstInitializer,
  getKey,
  getVariable,
  isGlobal,
  unwrap,
} from './bindings'
import { readObject } from './static'

/**
 * Identify WebMCP calls and cache static facts within a source file.
 */
export class ApiAnalyzer {
  /**
   * Validated target and wrapper settings for this analyzer.
   */
  public readonly settings: Required<WebMcpSettings>
  /**
   * ESLint source and scope information for the analyzed file.
   */
  public readonly source: TSESLint.SourceCode
  /**
   * Memoized facts and skipped calls keyed by AST node.
   */
  private readonly calls = new WeakMap<
    TSESTree.CallExpression,
    ApiCall | null
  >()

  /**
   * Initialize an analyzer for a source file and WebMCP configuration.
   *
   * @param source ESLint source and scope information for the file.
   * @param settings Value of the ESLint webmcp setting.
   * @throws {Error} If the WebMCP settings are invalid.
   */
  public constructor(source: TSESLint.SourceCode, settings: unknown) {
    this.source = source
    this.settings = resolveSettings(settings)
  }

  /**
   * Resolve an expression to a global ModelContext receiver.
   *
   * @param node Expression to inspect for a direct receiver or a safe alias.
   * @param depth Number of receiver aliases already followed.
   * @returns The global owning ModelContext, or undefined if unresolved.
   */
  public getReceiver(
    node: TSESTree.Node,
    depth = 0,
  ): 'document' | 'navigator' | undefined {
    if (depth > ANALYSIS_MAX_DEPTH) {
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

  /**
   * Resolve a native method reference and determine whether it retains its
   * receiver.
   *
   * @param node Callee expression to resolve.
   * @param depth Number of extracted references already followed.
   * @returns The method descriptor, or undefined if it cannot be resolved.
   */
  private getMethod(
    node: TSESTree.Node,
    depth = 0,
  ): Pick<ApiCall, 'method' | 'receiver' | 'bound'> | undefined {
    if (depth > ANALYSIS_MAX_DEPTH) {
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

  /**
   * Match a callee’s named import binding against configured wrappers.
   *
   * @param node Call expression to inspect.
   * @returns The configured tool argument index, or undefined if no wrapper
   *   matches.
   */
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

  /**
   * Collect static call facts for a native method or configured wrapper.
   *
   * @param node Call expression to identify.
   * @returns The cached or newly collected facts, or undefined for unrecognized
   *   calls.
   */
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
    const optionIndex = API_OPTION_INDICES[descriptor.method] ?? -1
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

/**
 * Analyzer cache partitioned by source file and serialized WebMCP settings.
 */
const ANALYZERS = new WeakMap<TSESLint.SourceCode, Map<string, ApiAnalyzer>>()

/**
 * Reuse an analyzer across rules applied to the same source and settings.
 *
 * @param source ESLint source and scope information for the file.
 * @param settings Raw WebMCP settings for the current rule.
 * @returns The analyzer for the resolved configuration.
 * @throws {Error} If the WebMCP settings are invalid.
 */
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

/**
 * Check whether a call supplies a WebMCP tool definition.
 *
 * @param call Static facts about the candidate call.
 * @returns Whether the call directly registers a tool or invokes a trusted
 *   wrapper.
 */
export function isDefinition(call: ApiCall): boolean {
  return (
    call.bound &&
    ((call.receiver === 'document' && call.method === 'registerTool') ||
      call.receiver === 'wrapper')
  )
}

/**
 * Read the value node of a statically known tool definition property.
 *
 * @param call Static facts about the candidate call.
 * @param name Tool definition property to look up.
 * @returns The value node when the call supplies a definition with a known
 *   property, or undefined otherwise.
 */
export function getDefinitionProperty(
  call: ApiCall,
  name: string,
): TSESTree.Node | undefined {
  return isDefinition(call) ? call.tool?.properties.get(name)?.value : undefined
}

/**
 * Check whether a bound document call uses a method supported by the target.
 *
 * @param call Static facts about the candidate call.
 * @param target API snapshot used for linting.
 * @returns Whether the call is a supported document ModelContext call.
 */
export function isCurrentCall(call: ApiCall, target: WebMcpTarget): boolean {
  return (
    call.receiver === 'document' &&
    call.bound &&
    supportsApiMethod(target, call.method)
  )
}

/**
 * Check whether a call refers to a supported or legacy native method.
 *
 * @param call Static facts about the candidate call.
 * @param target API snapshot used for linting.
 * @returns Whether the call refers to a recognized native ModelContext method.
 */
export function isNativeMethod(call: ApiCall, target: WebMcpTarget): boolean {
  return (
    call.receiver !== 'wrapper' &&
    (supportsApiMethod(target, call.method) ||
      LEGACY_METHODS.includes(call.method))
  )
}
