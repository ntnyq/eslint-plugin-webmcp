import type { ValueFact } from '../types'

/**
 * Maximum depth for recursive alias and static value analysis.
 */
export const ANALYSIS_MAX_DEPTH = 20

/**
 * Initial node budget and maximum size of a statically read object literal.
 */
export const ANALYSIS_MAX_NODES = 1000

/**
 * The shared result for a value that cannot be determined statically.
 */
export const UNKNOWN_VALUE: ValueFact = { kind: 'unknown' }
