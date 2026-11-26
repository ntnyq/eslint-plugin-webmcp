/**
 * Validate the length and allowed characters of a WebMCP tool name.
 *
 * @param name Candidate tool name.
 * @returns Whether the name has 1 to 128 ASCII letters, digits, underscores,
 *   dots or hyphens.
 */
export function isValidToolName(name: string): boolean {
  return name.length > 0 && name.length <= 128 && !/[^A-Za-z0-9_.-]/u.test(name)
}
