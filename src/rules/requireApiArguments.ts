import { PROFILES } from '../constants'
import { createApiRule, isCurrentCall } from '../utils'

/**
 * Report omitted tool arguments, readiness promises and target-required JSON
 * input.
 */
export const requireApiArguments = createApiRule({
  name: 'require-api-arguments',
  description: 'Require mandatory WebMCP call arguments.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    missing: '{{method}} requires a tool argument.',
    promise: 'waitForToolsUntil requires a promise argument.',
    input: '{{target}} requires a JSON text input argument for executeTool.',
  },
  check(call, analyzer, context) {
    const { target } = analyzer.settings

    if (!isCurrentCall(call, target)) {
      return
    }

    if (call.method !== 'getTools' && call.node.arguments.length === 0) {
      context.report({
        node: call.node,
        messageId: call.method === 'waitForToolsUntil' ? 'promise' : 'missing',
        data: { method: call.method },
      })
    } else if (
      call.method === 'executeTool' &&
      PROFILES[target].executeInput === 'required-json-text' &&
      call.node.arguments.length === 1 &&
      call.node.arguments[0]?.type !== 'SpreadElement'
    ) {
      context.report({
        node: call.node,
        messageId: 'input',
        data: { target },
      })
    }
  },
})
