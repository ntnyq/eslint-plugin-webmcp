/**
 * Unicode code-point budgets for tool and input parameter descriptions.
 */
export interface DescriptionLengthOptions {
  /**
   * Maximum length of a tool description. Defaults to 500 code points.
   */
  tool?: number

  /**
   * Maximum length of a parameter description. Defaults to 150 code points.
   */
  parameter?: number

  /**
   * Unit used to measure description length.
   */
  unit?: 'codePoint'
}

/**
 * Naming styles supported for an entire tool name or one dot-separated segment.
 */
export type NameStyle = 'snake_case' | 'kebab-case' | 'camelCase'

/**
 * Options for the project-specific tool name convention.
 */
export interface NameOptions {
  /**
   * Naming convention applied after the configured prefix. Defaults to
   * snake_case.
   */
  style?: NameStyle | 'dot-separated'

  /**
   * Naming convention for each dot-separated segment. Defaults to kebab-case.
   */
  segmentStyle?: NameStyle

  /**
   * Exact prefix required before the name is checked against the selected
   * style.
   */
  prefix?: string
}

/**
 * Option tuple selecting platform checks or JSON Schema 2020-12 validation.
 */
export type SchemaOptions = [
  { mode: 'platform' } | { mode: 'json-schema'; dialect: '2020-12' },
]
