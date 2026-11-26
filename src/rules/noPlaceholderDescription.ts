import { DEFAULT_DESCRIPTION_PLACEHOLDERS } from '../constants'
import {
  createApiRule,
  getDefinitionProperty,
  readString,
  stringListOption,
} from '../utils'

/**
 * Match complete descriptions against configured placeholders after trimming
 * whitespace and normalizing case.
 */
export const noPlaceholderDescription = createApiRule({
  name: 'no-placeholder-description',
  description: 'Replace complete placeholder descriptions with useful text.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ placeholders: [...DEFAULT_DESCRIPTION_PLACEHOLDERS] }],
  schema: stringListOption('placeholders'),
  messages: {
    placeholder:
      'Replace the placeholder description "{{description}}" with the tool’s purpose.',
  },
  check(call, analyzer, context, [options]) {
    const node = getDefinitionProperty(call, 'description')
    const description = readString(analyzer.source, node)

    if (
      node &&
      description &&
      options.placeholders.some(
        placeholder =>
          placeholder.trim().toLowerCase() === description.trim().toLowerCase(),
      )
    ) {
      context.report({ node, messageId: 'placeholder', data: { description } })
    }
  },
})
