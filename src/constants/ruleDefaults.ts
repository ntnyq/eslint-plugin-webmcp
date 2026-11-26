/**
 * Default Unicode code-point limits for tool and parameter descriptions.
 */
export const DEFAULT_DESCRIPTION_LENGTH_OPTIONS = {
  tool: 500,
  parameter: 150,
  unit: 'codePoint',
} as const

/**
 * Placeholder descriptions reported when no custom list is configured.
 */
export const DEFAULT_DESCRIPTION_PLACEHOLDERS: readonly string[] = [
  'TODO',
  'TBD',
  'FIXME',
]

/**
 * Annotation fields that require explicit values by default.
 */
export const DEFAULT_EXPLICIT_ANNOTATION_FIELDS: readonly string[] = [
  'readOnlyHint',
  'consequentialHint',
]

/**
 * Default style, segment style and prefix for project-specific tool names.
 */
export const DEFAULT_TOOL_NAME_OPTIONS = {
  style: 'snake_case',
  segmentStyle: 'kebab-case',
  prefix: '',
} as const
