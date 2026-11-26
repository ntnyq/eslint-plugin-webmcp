import { createApiRule, getDefinitionProperty, readString } from '../utils'

/**
 * Report known tool descriptions that are empty after trimming whitespace.
 */
export const noEmptyDescription = createApiRule({
  name: 'no-empty-description',
  description: 'Require nonempty, non-whitespace tool descriptions.',
  type: 'suggestion',
  recommended: 'warn',
  defaultOptions: [],
  messages: {
    empty:
      'Describe what this tool does; its description is empty or whitespace-only.',
  },
  check(call, analyzer, context) {
    const node = getDefinitionProperty(call, 'description')
    const description = readString(analyzer.source, node)

    if (node && description !== undefined && description.trim().length === 0) {
      context.report({ node, messageId: 'empty' })
    }
  },
})
