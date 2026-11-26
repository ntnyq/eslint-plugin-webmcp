import { createApiRule, getField, isDefinition, readValue } from '../utils'

/**
 * Report missing titles and titles that are statically empty or undefined.
 */
export const preferToolTitle = createApiRule({
  name: 'prefer-tool-title',
  description: 'Opt into human-readable tool titles.',
  type: 'suggestion',
  defaultOptions: [],
  messages: { title: 'Provide a human-readable title for this tool.' },
  check(call, analyzer, context) {
    if (!isDefinition(call) || !call.toolNode) {
      return
    }

    const title = getField(call.tool, 'title')
    const value =
      title.kind === 'known'
        ? readValue(analyzer.source, title.node)
        : undefined

    if (
      title.kind === 'missing' ||
      (value?.kind === 'known' &&
        (value.value === undefined ||
          (typeof value.value === 'string' && value.value.trim().length === 0)))
    ) {
      context.report({
        node: title.kind === 'known' ? title.node : call.toolNode,
        messageId: 'title',
      })
    }
  },
})
