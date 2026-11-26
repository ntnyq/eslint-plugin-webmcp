import {
  createApiRule,
  isCurrentCall,
  isGlobal,
  readValue,
  resolveExpression,
} from '../utils'

/**
 * Report signal values that are statically incompatible with AbortSignal.
 */
export const validAbortSignal = createApiRule({
  name: 'valid-abort-signal',
  description: 'Reject values that are definitely not AbortSignals.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'Pass an AbortSignal, such as controller.signal, as the signal option.',
  },
  check(call, analyzer, context) {
    const node =
      isCurrentCall(call, analyzer.settings.target) &&
      call.method !== 'getTools'
        ? call.options?.properties.get('signal')?.value
        : undefined

    if (!node) {
      return
    }

    const expression = resolveExpression(analyzer.source, node)
    const fact = readValue(analyzer.source, expression)

    if (
      (fact.kind === 'known' && fact.value !== undefined) ||
      expression.type === 'ObjectExpression' ||
      expression.type === 'ArrayExpression' ||
      expression.type === 'ArrowFunctionExpression' ||
      expression.type === 'FunctionExpression' ||
      (expression.type === 'NewExpression' &&
        isGlobal(analyzer.source, expression.callee, 'AbortController'))
    ) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})
