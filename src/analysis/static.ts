import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { getConstInitializer, getKey, isGlobal, unwrap } from './bindings'

export type StaticValue =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | StaticValue[]
  | { [key: string]: StaticValue }
export type ValueFact =
  | { kind: 'known'; value: StaticValue }
  | { kind: 'unknown' }
export type FieldFact =
  | { kind: 'known'; node: TSESTree.Node }
  | { kind: 'missing' }
  | { kind: 'unknown' }
export interface ObjectFacts {
  node: TSESTree.ObjectExpression
  properties: Map<string, TSESTree.Property>
  complete: boolean
}

const UNKNOWN: ValueFact = { kind: 'unknown' }
const MAX_DEPTH = 20
const MAX_NODES = 1000

export function resolveExpression(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
  depth = 0,
): TSESTree.Node {
  const expression = unwrap(node)
  if (depth < MAX_DEPTH && expression.type === 'Identifier') {
    const initializer = getConstInitializer(source, expression)
    if (initializer) {
      return resolveExpression(source, initializer, depth + 1)
    }
  }
  return expression
}

export function readObject(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
  depth = 0,
): ObjectFacts | undefined {
  if (!node || depth > MAX_DEPTH) {
    return undefined
  }
  const expression = resolveExpression(source, node)
  if (
    expression.type !== 'ObjectExpression' ||
    expression.properties.length > MAX_NODES
  ) {
    return undefined
  }
  const properties = new Map<string, TSESTree.Property>()
  let complete = true
  for (const property of expression.properties) {
    if (property.type === 'SpreadElement') {
      const spread = readObject(source, property.argument, depth + 1)
      if (!spread?.complete) {
        properties.clear()
        complete = false
      }
      for (const [name, field] of spread?.properties ?? []) {
        properties.set(name, field)
      }
    } else {
      const key = getKey(property)
      // Accessors and prototype providers can affect other dictionary fields.
      if (property.kind !== 'init' || key === '__proto__') {
        return undefined
      }
      if (key === undefined) {
        properties.clear()
        complete = false
      } else {
        properties.set(key, property)
      }
    }
  }
  return { node: expression, properties, complete }
}

export function getField(
  object: ObjectFacts | undefined,
  name: string,
): FieldFact {
  const property = object?.properties.get(name)
  if (property) {
    return { kind: 'known', node: property.value }
  }
  return { kind: object?.complete ? 'missing' : 'unknown' }
}

export function readValue(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
  depth = 0,
  budget?: { remaining: number },
): ValueFact {
  const remaining = budget ?? { remaining: MAX_NODES }
  if (!node || depth > MAX_DEPTH || remaining.remaining-- <= 0) {
    return UNKNOWN
  }
  const expression = resolveExpression(source, node)
  if (expression.type === 'Literal') {
    if ('regex' in expression) {
      return UNKNOWN
    }
    return { kind: 'known', value: expression.value }
  }
  if (
    expression.type === 'Identifier' &&
    isGlobal(source, expression, 'undefined')
  ) {
    return { kind: 'known', value: undefined }
  }
  if (
    expression.type === 'TemplateLiteral' &&
    expression.expressions.length === 0
  ) {
    const value = expression.quasis[0]?.value.cooked
    return value === null || value === undefined
      ? UNKNOWN
      : { kind: 'known', value }
  }
  if (expression.type === 'UnaryExpression') {
    const argument = readValue(
      source,
      expression.argument,
      depth + 1,
      remaining,
    )
    if (argument.kind === 'known' && expression.operator === 'void') {
      return { kind: 'known', value: undefined }
    }
    if (
      argument.kind === 'known' &&
      typeof argument.value === 'number' &&
      (expression.operator === '-' || expression.operator === '+')
    ) {
      return {
        kind: 'known',
        value: expression.operator === '-' ? -argument.value : argument.value,
      }
    }
  }
  if (expression.type === 'ArrayExpression') {
    const values: StaticValue[] = []
    for (const element of expression.elements) {
      const fact = element
        ? readValue(source, element, depth + 1, remaining)
        : { kind: 'known' as const, value: undefined }
      if (fact.kind === 'unknown') {
        return UNKNOWN
      }
      values.push(fact.value)
    }
    return { kind: 'known', value: values }
  }
  const object = readObject(source, expression)
  if (object?.complete && !object.properties.has('toJSON')) {
    const entries: [string, StaticValue][] = []
    for (const [name, property] of object.properties) {
      const fact = readValue(source, property.value, depth + 1, remaining)
      if (fact.kind === 'unknown') {
        return UNKNOWN
      }
      entries.push([name, fact.value])
    }
    return { kind: 'known', value: Object.fromEntries(entries) }
  }
  return UNKNOWN
}

export function readString(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
): string | undefined {
  const fact = readValue(source, node)
  return fact.kind === 'known' && typeof fact.value === 'string'
    ? fact.value
    : undefined
}

export function isDefinitelyNonCallable(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
): boolean {
  const expression = resolveExpression(source, node)
  return (
    readValue(source, expression).kind === 'known' ||
    expression.type === 'ObjectExpression' ||
    expression.type === 'ArrayExpression' ||
    expression.type === 'ClassExpression' ||
    expression.type === 'Literal'
  )
}
