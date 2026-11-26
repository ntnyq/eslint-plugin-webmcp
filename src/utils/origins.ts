import type { TSESTree } from '@typescript-eslint/utils'
import { API_ORIGIN_OPTIONS } from '../constants'
import type { ApiCall } from '../types'
import { isCurrentCall } from './analysis/api'
import type { ApiAnalyzer } from './analysis/api'
import { resolveExpression } from './analysis/static'

/**
 * Find the origin list option on a supported registration or discovery call.
 *
 * @param call Static facts about the candidate API call.
 * @param analyzer Analyzer holding the selected API target.
 * @returns The origin list expression, or undefined if the option is
 *   unavailable.
 */
export function getOrigins(
  call: ApiCall,
  analyzer: ApiAnalyzer,
): TSESTree.Node | undefined {
  if (!isCurrentCall(call, analyzer.settings.target)) {
    return undefined
  }

  if (call.method !== 'registerTool' && call.method !== 'getTools') {
    return undefined
  }

  return call.options?.properties.get(API_ORIGIN_OPTIONS[call.method])?.value
}

/**
 * Read the directly visible entries of an origin list array.
 *
 * @param analyzer Analyzer that provides scope information to resolve aliases.
 * @param node Candidate origin list expression.
 * @returns The visible entries, including holes, with spread elements omitted.
 */
export function getOriginEntries(
  analyzer: ApiAnalyzer,
  node: TSESTree.Node,
): (TSESTree.Expression | null)[] {
  const expression = resolveExpression(analyzer.source, node)

  return expression.type === 'ArrayExpression'
    ? expression.elements.filter(
        (element): element is TSESTree.Expression | null =>
          element === null || element.type !== 'SpreadElement',
      )
    : []
}

/**
 * Parse an absolute URL for an origin list entry.
 *
 * @param value Candidate URL string.
 * @returns The parsed URL, or undefined if the string is invalid.
 */
export function parseOrigin(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}
