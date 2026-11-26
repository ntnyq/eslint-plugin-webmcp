import { PROFILES } from '../constants'
import {
  createApiRule,
  getField,
  isCurrentCall,
  readValue,
  resolveExpression,
} from '../utils'

/**
 * Check the dictionary fields or native Tool handle expected by executeTool.
 * The selected API snapshot determines which representation is accepted.
 */
export const validRegisteredTool = createApiRule({
  name: 'valid-registered-tool',
  description:
    'Validate executeTool dictionaries or native Tool arguments by target.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'executeTool expects a RegisteredTool dictionary, not a tool name or primitive.',
    missing: 'RegisteredTool is missing required property "{{property}}".',
    native:
      'executeTool expects a native Tool returned by getTools(); primitives, object literals and copies are not Tool instances.',
  },
  check(call, analyzer, context) {
    if (
      !isCurrentCall(call, analyzer.settings.target) ||
      call.method !== 'executeTool' ||
      !call.toolNode
    ) {
      return
    }

    const fact = readValue(analyzer.source, call.toolNode)
    const expression = resolveExpression(analyzer.source, call.toolNode)

    if (
      PROFILES[analyzer.settings.target].executeToolArgument === 'native-tool'
    ) {
      // A literal cannot carry the native interface brand, even with getters,
      // unknown spreads or Tool.prototype. Unresolved handles remain unknown.
      if (
        fact.kind === 'known' ||
        [
          'ObjectExpression',
          'ArrayExpression',
          'FunctionExpression',
          'ArrowFunctionExpression',
          'ClassExpression',
          'Literal',
        ].includes(expression.type)
      ) {
        context.report({ node: call.toolNode, messageId: 'native' })
      }

      return
    }

    if (
      fact.kind === 'known' &&
      (fact.value === null || typeof fact.value !== 'object')
    ) {
      context.report({ node: call.toolNode, messageId: 'invalid' })

      return
    }

    for (const property of ['name', 'description', 'window', 'origin']) {
      const field = getField(call.tool, property)
      const value =
        field.kind === 'known'
          ? readValue(analyzer.source, field.node)
          : undefined

      if (
        expression.type === 'ArrayExpression' ||
        field.kind === 'missing' ||
        (value?.kind === 'known' && value.value === undefined)
      ) {
        context.report({
          node: field.kind === 'known' ? field.node : call.toolNode,
          messageId: 'missing',
          data: { property },
        })
      }
    }
  },
})
