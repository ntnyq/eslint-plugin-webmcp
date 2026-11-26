import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Static facts about a recognized ModelContext or configured wrapper call.
 */
export interface ApiCall {
  /**
   * Original call site used for diagnostics.
   */
  node: TSESTree.CallExpression

  /**
   * ModelContext method name or the definition marker for a wrapper.
   */
  method: string

  /**
   * Global owning ModelContext or the wrapper marker.
   */
  receiver: 'document' | 'navigator' | 'wrapper'

  /**
   * Whether the call retains its receiver or invokes a wrapper directly.
   */
  bound: boolean

  /**
   * Known tool dictionary fields, if its argument can be analyzed.
   */
  tool: ObjectFacts | undefined

  /**
   * Tool argument expression at its known position, when provided.
   */
  toolNode: TSESTree.Node | undefined

  /**
   * Known API option fields, if its argument can be analyzed.
   */
  options: ObjectFacts | undefined
}

/**
 * A primitive, array or dictionary value that can be reconstructed statically.
 */
export type StaticValue =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | StaticValue[]
  | { [key: string]: StaticValue }
/**
 * Result of static value analysis, which can represent a known undefined value.
 */
export type ValueFact =
  | { kind: 'known'; value: StaticValue }
  | { kind: 'unknown' }
/**
 * Known, absent or indeterminate status of a dictionary field.
 */
export type FieldFact =
  | { kind: 'known'; node: TSESTree.Node }
  | { kind: 'missing' }
  | { kind: 'unknown' }
/**
 * The statically readable fields and completeness of an object expression.
 */
export interface ObjectFacts {
  /**
   * Resolved object literal from which the fields were read.
   */
  node: TSESTree.ObjectExpression

  /**
   * Known final property definitions keyed by their static names.
   */
  properties: Map<string, TSESTree.Property>

  /**
   * Whether missing entries can be proven absent from the dictionary.
   */
  complete: boolean
}

/**
 * Shared node allowance for a recursive static analysis traversal.
 */
export interface AnalysisBudget {
  /**
   * Number of nodes still available to visit.
   */
  remaining: number
}
