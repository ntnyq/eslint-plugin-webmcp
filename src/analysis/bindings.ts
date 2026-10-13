import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

const MAX_DEPTH = 20

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

function hasSafeReceiverReferences(
  source: TSESLint.SourceCode,
  variable: TSESLint.Scope.Variable,
  seen = new Set<TSESLint.Scope.Variable>(),
): boolean {
  if (
    seen.has(variable) ||
    seen.size > MAX_DEPTH ||
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
      const { parent } = reference.identifier
      if (
        parent.type === 'MemberExpression' &&
        parent.object === reference.identifier
      ) {
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
 * Only immutable bindings are followed. Objects additionally need a single read,
 * preventing writes, aliases, exports and escapes from masquerading as constants.
 *
 * @param source The parser-provided source and scope manager
 * @param node The identifier at its use site
 * @param mode Whether to enforce value ownership or native method/receiver constraints
 * @returns The initializer only when its binding is safe to follow
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
