import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import {
  ANALYSIS_MAX_DEPTH,
  ANALYSIS_MAX_NODES,
  UNKNOWN_VALUE,
} from '../../constants'
import type {
  AnalysisBudget,
  FieldFact,
  ObjectFacts,
  StaticValue,
  ValueFact,
} from '../../types'
import { getConstInitializer, getKey, isGlobal, unwrap } from './bindings'

/**
 * Unwrap an expression and follow safe constant aliases within the depth limit.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Expression to resolve.
 * @param depth Number of aliases already followed.
 * @returns The deepest expression that can be resolved safely.
 */
export function resolveExpression(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
  depth = 0,
): TSESTree.Node {
  const expression = unwrap(node)

  if (depth < ANALYSIS_MAX_DEPTH && expression.type === 'Identifier') {
    const initializer = getConstInitializer(source, expression)

    if (initializer) {
      return resolveExpression(source, initializer, depth + 1)
    }
  }

  return expression
}

/**
 * Collect known fields from an object literal and supported spreads.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Candidate dictionary expression, when present.
 * @param depth Current depth of spread traversal.
 * @returns The known field map and its completeness, or undefined if
 *   unreadable.
 */
export function readObject(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
  depth = 0,
): ObjectFacts | undefined {
  if (!node || depth > ANALYSIS_MAX_DEPTH) {
    return undefined
  }

  const expression = resolveExpression(source, node)

  if (
    expression.type !== 'ObjectExpression' ||
    expression.properties.length > ANALYSIS_MAX_NODES
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

/**
 * Determine whether an object field is known, missing or indeterminate.
 *
 * @param object Known object facts, if a dictionary could be read.
 * @param name Property name to look up.
 * @returns The field fact, including its value node when known.
 */
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

/**
 * Read a static value from supported syntax without evaluating user code.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Expression to read, when present.
 * @param depth Current depth of value traversal.
 * @param budget Shared allowance for visiting value nodes.
 * @returns A known value or an unknown fact.
 */
export function readValue(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
  depth = 0,
  budget?: AnalysisBudget,
): ValueFact {
  const remaining = budget ?? { remaining: ANALYSIS_MAX_NODES }

  if (!node || depth > ANALYSIS_MAX_DEPTH || remaining.remaining-- <= 0) {
    return UNKNOWN_VALUE
  }

  const expression = resolveExpression(source, node)

  if (expression.type === 'Literal') {
    if ('regex' in expression) {
      return UNKNOWN_VALUE
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
      ? UNKNOWN_VALUE
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
        return UNKNOWN_VALUE
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
        return UNKNOWN_VALUE
      }

      entries.push([name, fact.value])
    }

    return { kind: 'known', value: Object.fromEntries(entries) }
  }

  return UNKNOWN_VALUE
}

/**
 * Read a statically known string from an expression.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Expression that may supply a string.
 * @returns The known string, or undefined if the expression cannot be read as a
 *   string.
 */
export function readString(
  source: TSESLint.SourceCode,
  node: TSESTree.Node | undefined,
): string | undefined {
  const fact = readValue(source, node)

  return fact.kind === 'known' && typeof fact.value === 'string'
    ? fact.value
    : undefined
}

/**
 * Identify supported expression forms whose values cannot be called.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Value expression to inspect.
 * @returns Whether the expression is known to be non-callable.
 */
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
