import {
  createApiRule,
  getDefinitionProperty,
  isValidToolName,
  readString,
} from '../utils'

/**
 * Check known string names against the WebMCP length and character limits.
 */
export const validToolName = createApiRule({
  name: 'valid-tool-name',
  description: 'Validate static tool names against the target API.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'Tool names must contain 1–128 ASCII letters, digits, underscores, hyphens or dots.',
  },
  check(call, analyzer, context) {
    const node = getDefinitionProperty(call, 'name')

    if (!node) {
      return
    }

    const name = readString(analyzer.source, node)

    if (name !== undefined && !isValidToolName(name)) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})
