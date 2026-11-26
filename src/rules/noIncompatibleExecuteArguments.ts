import { PROFILES } from '../constants'
import { createApiRule, readValue, resolveExpression } from '../utils'

/**
 * Report statically known inputs incompatible with the target’s object or JSON
 * text contract.
 */
export const noIncompatibleExecuteArguments = createApiRule({
  name: 'no-incompatible-execute-arguments',
  description:
    'Use the executeTool input representation required by the target.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    object:
      '{{target}} expects an input object; do not pass JSON text or primitives.',
    text: '{{target}} expects JSON text; explicitly serialize the input object.',
  },
  check(call, analyzer, context) {
    if (
      call.receiver !== 'document' ||
      !call.bound ||
      call.method !== 'executeTool' ||
      call.node.arguments.some(
        (argument, index) => index <= 1 && argument.type === 'SpreadElement',
      )
    ) {
      return
    }

    const [, node] = call.node.arguments

    if (!node) {
      return
    }

    const fact = readValue(analyzer.source, node)
    const expression = resolveExpression(analyzer.source, node)

    if (PROFILES[analyzer.settings.target].executeInput === 'optional-object') {
      if (
        fact.kind === 'known' &&
        fact.value !== undefined &&
        (fact.value === null || typeof fact.value !== 'object')
      ) {
        context.report({
          node,
          messageId: 'object',
          data: { target: analyzer.settings.target },
        })
      }
    } else if (
      expression.type === 'ObjectExpression' ||
      expression.type === 'ArrayExpression'
    ) {
      context.report({
        node,
        messageId: 'text',
        data: { target: analyzer.settings.target },
      })
    }
  },
})
