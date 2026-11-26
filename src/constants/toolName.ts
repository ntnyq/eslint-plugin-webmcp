import type { NameStyle } from '../types'

/**
 * Patterns used to check each supported tool naming style.
 */
export const NAME_PATTERNS: Record<NameStyle, RegExp> = {
  snake_case: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u,
  'kebab-case': /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u,
  camelCase: /^[a-z][a-zA-Z0-9]*$/u,
}
