import { createApiRule, isNativeMethod } from '../utils'

/**
 * Report recognized ModelContext methods called after losing their native
 * receiver.
 */
export const noUnboundApiCall = createApiRule({
  name: 'no-unbound-api-call',
  description:
    'Keep the native ModelContext receiver when calling its methods.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    unbound:
      'Call {{method}} on its ModelContext receiver, or explicitly bind the method to that receiver.',
  },
  check(call, analyzer, context) {
    if (isNativeMethod(call, analyzer.settings.target) && !call.bound) {
      context.report({
        node: call.node.callee,
        messageId: 'unbound',
        data: { method: call.method },
      })
    }
  },
})
