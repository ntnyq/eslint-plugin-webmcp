import { LEGACY_METHODS } from '../constants'
import { createApiRule, isNativeMethod } from '../utils'

/**
 * Report navigator.modelContext calls and removed methods on
 * document.modelContext.
 */
export const noUnsupportedApi = createApiRule({
  name: 'no-unsupported-api',
  description: 'Report legacy WebMCP entry points and removed methods.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    legacy:
      '{{target}} uses document.modelContext; migrate the entry point and registration lifecycle together.',
    removed:
      '{{method}} is not supported by {{target}}. Registration lifetime is controlled by options.signal.',
  },
  check(call, analyzer, context) {
    if (!isNativeMethod(call, analyzer.settings.target)) {
      return
    }

    if (call.receiver === 'navigator') {
      context.report({
        node: call.node.callee,
        messageId: 'legacy',
        data: { target: analyzer.settings.target },
      })
    } else if (LEGACY_METHODS.includes(call.method)) {
      context.report({
        node: call.node.callee,
        messageId: 'removed',
        data: { target: analyzer.settings.target, method: call.method },
      })
    }
  },
})
