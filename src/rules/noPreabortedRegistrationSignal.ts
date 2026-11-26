import {
  createApiRule,
  getKey,
  isCurrentCall,
  isGlobal,
  resolveExpression,
  unwrap,
} from '../utils'

/**
 * Flag direct calls to the global AbortSignal.abort() used as registration
 * signals.
 */
export const noPreabortedRegistrationSignal = createApiRule({
  name: 'no-preaborted-registration-signal',
  description: 'Avoid registering with an already-aborted signal.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: {
    aborted:
      'AbortSignal.abort() produces an already-aborted signal; this tool will not be registered.',
  },
  check(call, analyzer, context) {
    const node =
      isCurrentCall(call, analyzer.settings.target) &&
      call.method === 'registerTool'
        ? call.options?.properties.get('signal')?.value
        : undefined

    if (!node) {
      return
    }

    const expression = resolveExpression(analyzer.source, node)

    if (expression.type !== 'CallExpression') {
      return
    }

    const callee = unwrap(expression.callee)

    if (
      callee.type === 'MemberExpression' &&
      getKey(callee) === 'abort' &&
      isGlobal(analyzer.source, callee.object, 'AbortSignal')
    ) {
      context.report({ node, messageId: 'aborted' })
    }
  },
})
