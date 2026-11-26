/**
 * Zero-based positions of native method options dictionaries.
 */
export const API_OPTION_INDICES: Readonly<Record<string, number>> = {
  registerTool: 1,
  getTools: 0,
  executeTool: 2,
}

/**
 * Option names that carry an origin list, keyed by method.
 */
export const API_ORIGIN_OPTIONS = {
  registerTool: 'exposedTo',
  getTools: 'fromOrigins',
} as const
