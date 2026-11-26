import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { ANALYSIS_MAX_DEPTH } from '../../constants'

/**
 * Remove TypeScript expression wrappers and optional-chain wrappers.
 *
 * @param node AST node to unwrap.
 * @returns The innermost expression, or the original node if already unwrapped.
 */
export function unwrap(node: TSESTree.Node): TSESTree.Node {
  switch (node.type) {
    case 'TSAsExpression':
    case 'TSTypeAssertion':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSInstantiationExpression':
    case 'ChainExpression': {
      return unwrap(node.expression)
    }
    default: {
      return node
    }
  }
}

/**
 * Read a member or property key that is statically known.
 *
 * @param node Member access or object property to inspect.
 * @returns The property name, or undefined for an unresolved computed key.
 */
export function getKey(
  node: TSESTree.MemberExpression | TSESTree.Property,
): string | undefined {
  const key = node.type === 'MemberExpression' ? node.property : node.key

  if (!node.computed && key.type === 'Identifier') {
    return key.name
  }

  const unwrapped = unwrap(key)

  if (
    unwrapped.type === 'Literal' &&
    (typeof unwrapped.value === 'string' || typeof unwrapped.value === 'number')
  ) {
    return String(unwrapped.value)
  }

  if (
    unwrapped.type === 'TemplateLiteral' &&
    unwrapped.expressions.length === 0
  ) {
    return unwrapped.quasis[0]?.value.cooked ?? undefined
  }

  return undefined
}

/**
 * Look up the binding of an identifier through enclosing ESLint scopes.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Identifier at the reference site.
 * @returns The nearest variable binding, or undefined if unresolved.
 */
export function getVariable(
  source: TSESLint.SourceCode,
  node: TSESTree.Identifier,
): TSESLint.Scope.Variable | undefined {
  let scope: TSESLint.Scope.Scope | null = source.getScope(node)

  while (scope) {
    const variable = scope.set.get(node.name)

    if (variable) {
      return variable
    }

    scope = scope.upper
  }

  return undefined
}

/**
 * Check whether an expression references the named unshadowed global.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Expression to check for a global identifier.
 * @param name Expected global name.
 * @returns Whether the identifier refers to an unresolved or predefined global.
 */
export function isGlobal(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
  name: string,
): boolean {
  const expression = unwrap(node)

  if (expression.type !== 'Identifier' || expression.name !== name) {
    return false
  }

  const variable = getVariable(source, expression)

  return !variable || variable.defs.length === 0
}

/**
 * Find the program or function that owns a node’s execution.
 *
 * @param node AST node whose execution context is needed.
 * @returns The nearest enclosing execution owner or the root reached by
 *   traversal.
 */
function getExecutionOwner(node: TSESTree.Node): TSESTree.Node {
  let current = node

  while (current.parent) {
    current = current.parent

    if (
      current.type === 'Program' ||
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      return current
    }
  }

  return current
}

/**
 * Detect mutation of a member through assignment, update or deletion.
 *
 * @param node Member expression whose use is being checked.
 * @returns Whether the member is written to or deleted.
 */
function isWriteTarget(node: TSESTree.MemberExpression): boolean {
  let current: TSESTree.Node = node

  while (current.parent) {
    const { parent }: TSESTree.Node = current

    switch (parent.type) {
      case 'AssignmentExpression':
      case 'ForInStatement':
      case 'ForOfStatement': {
        return parent.left === current
      }
      case 'UpdateExpression': {
        return parent.argument === current
      }
      case 'UnaryExpression': {
        return parent.operator === 'delete' && parent.argument === current
      }
      case 'Property': {
        if (
          parent.value !== current ||
          parent.parent.type !== 'ObjectPattern'
        ) {
          return false
        }

        break
      }
      case 'AssignmentPattern': {
        if (parent.left !== current) {
          return false
        }

        break
      }
      case 'RestElement':
      case 'ArrayPattern':
      case 'ObjectPattern': {
        break
      }
      default: {
        if (unwrap(parent) !== node) {
          return false
        }
      }
    }

    current = parent
  }

  return false
}

/**
 * Verify that all reads of a receiver binding stay within supported alias uses.
 *
 * @param source ESLint source that supplies scope information.
 * @param variable Receiver binding to inspect for mutations and escapes.
 * @param seen Receiver bindings already visited during this traversal.
 * @returns Whether the references preserve the original receiver.
 */
function hasSafeReceiverReferences(
  source: TSESLint.SourceCode,
  variable: TSESLint.Scope.Variable,
  seen = new Set<TSESLint.Scope.Variable>(),
): boolean {
  if (
    seen.has(variable) ||
    seen.size > ANALYSIS_MAX_DEPTH ||
    variable.references.some(
      reference => reference.isWrite() && !reference.init,
    )
  ) {
    return false
  }

  seen.add(variable)

  return variable.references
    .filter(reference => reference.isRead())
    .every(reference => {
      let node: TSESTree.Node = reference.identifier

      while (node.parent && unwrap(node.parent) === reference.identifier) {
        node = node.parent
      }

      const { parent } = node

      if (!parent) {
        return false
      }

      if (parent.type === 'MemberExpression' && parent.object === node) {
        return !isWriteTarget(parent)
      }

      if (
        parent.type === 'VariableDeclarator' &&
        parent.parent.type === 'VariableDeclaration' &&
        parent.parent.kind === 'const'
      ) {
        if (parent.id.type === 'ObjectPattern') {
          return true
        }

        if (parent.id.type === 'Identifier') {
          const alias = getVariable(source, parent.id)

          return (
            alias !== undefined &&
            hasSafeReceiverReferences(source, alias, seen)
          )
        }
      }

      return false
    })
}

/**
 * Follow immutable bindings with conservative ownership checks for values.
 * The value mode requires a single read for object expressions.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Identifier at its use site.
 * @param mode Ownership checks for a value, native receiver or method alias.
 * @returns The initializer when the binding is safe to follow, or undefined.
 */
export function getConstInitializer(
  source: TSESLint.SourceCode,
  node: TSESTree.Identifier,
  mode: 'value' | 'receiver' | 'method' = 'value',
): TSESTree.Node | undefined {
  const variable = getVariable(source, node)

  if (
    !variable ||
    variable.defs.length !== 1 ||
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
    definition.node.id.type !== 'Identifier' ||
    !definition.node.init
  ) {
    return undefined
  }

  if (
    definition.parent.parent.type === 'ExportNamedDeclaration' ||
    definition.node.range[1] > node.range[0] ||
    getExecutionOwner(definition.node) !== getExecutionOwner(node)
  ) {
    return undefined
  }

  const initializer = unwrap(definition.node.init)
  const reads = variable.references.filter(reference => reference.isRead())

  if (mode === 'receiver') {
    if (!hasSafeReceiverReferences(source, variable)) {
      return undefined
    }
  } else if (
    mode === 'value' &&
    initializer.type !== 'Literal' &&
    initializer.type !== 'TemplateLiteral' &&
    initializer.type !== 'UnaryExpression' &&
    (reads.length !== 1 || reads[0]?.identifier !== node)
  ) {
    return undefined
  }

  return initializer
}
