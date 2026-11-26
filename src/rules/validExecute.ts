import {
  createApiRule,
  getDefinitionProperty,
  isDefinitelyNonCallable,
  readValue,
} from '../utils'

/**
 * Report execute values that can be proven non-callable.
 */
export const validExecute = createApiRule({
  name: 'valid-execute',
  description: 'Reject definitely non-callable execute values.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'The execute property must be callable; an async keyword is not required.',
  },
  check(call, analyzer, context) {
    const node = getDefinitionProperty(call, 'execute')
    const value = readValue(analyzer.source, node)

    if (
      node &&
      !(value.kind === 'known' && value.value === undefined) &&
      isDefinitelyNonCallable(analyzer.source, node)
    ) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})
