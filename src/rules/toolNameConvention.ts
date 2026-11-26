import { DEFAULT_TOOL_NAME_OPTIONS, NAME_PATTERNS } from '../constants'
import type { NameOptions } from '../types'
import {
  createApiRule,
  getDefinitionProperty,
  isValidToolName,
  readString,
} from '../utils'

/**
 * Check otherwise valid tool names against a configured style and prefix.
 */
export const toolNameConvention = createApiRule<[NameOptions], 'convention'>({
  name: 'tool-name-convention',
  description:
    'Apply a project-specific naming convention to valid tool names.',
  type: 'suggestion',
  defaultOptions: [{ ...DEFAULT_TOOL_NAME_OPTIONS }],
  schema: [
    {
      type: 'object',
      properties: {
        style: {
          type: 'string',
          enum: ['snake_case', 'kebab-case', 'camelCase', 'dot-separated'],
        },
        segmentStyle: {
          type: 'string',
          enum: ['snake_case', 'kebab-case', 'camelCase'],
        },
        prefix: { type: 'string' },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    convention:
      'Tool name "{{name}}" does not follow the configured {{style}} style and prefix "{{prefix}}".',
  },
  check(call, analyzer, context, [options]) {
    const node = getDefinitionProperty(call, 'name')
    const name = readString(analyzer.source, node)

    if (!node || name === undefined || !isValidToolName(name)) {
      return
    }

    const {
      style = DEFAULT_TOOL_NAME_OPTIONS.style,
      segmentStyle = DEFAULT_TOOL_NAME_OPTIONS.segmentStyle,
      prefix = DEFAULT_TOOL_NAME_OPTIONS.prefix,
    } = options
    const suffix = name.slice(prefix.length)
    const matchesStyle =
      style === 'dot-separated'
        ? suffix
            .split('.')
            .every(segment => NAME_PATTERNS[segmentStyle].test(segment))
        : NAME_PATTERNS[style].test(suffix)

    if (!name.startsWith(prefix) || !matchesStyle) {
      context.report({
        node,
        messageId: 'convention',
        data: { name, style, prefix },
      })
    }
  },
})
