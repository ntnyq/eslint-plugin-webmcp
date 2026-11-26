import type { TSESLint } from '@typescript-eslint/utils'
import type { ApiAnalyzer } from '../utils'
import type { ApiCall } from './analysis'

/**
 * Rule documentation metadata that controls built-in preset severities.
 */
export interface RuleDocs {
  /**
   * Severity enabled in both presets when present.
   */
  recommended?: 'error' | 'warn'

  /**
   * Severity enabled in the strict preset when no recommended severity is set.
   */
  strict?: 'error' | 'warn'
}

/**
 * Metadata and diagnostics for a rule that checks recognized WebMCP calls.
 *
 * @template Options Rule option tuple passed to the check.
 * @template MessageIds Diagnostic IDs supported by the rule.
 */
export interface ApiRuleDefinition<
  Options extends readonly unknown[] | [],
  MessageIds extends string,
> extends RuleDocs {
  /**
   * Unprefixed ESLint rule ID.
   */
  name: string

  /**
   * Short description of the rule’s purpose.
   */
  description: string

  /**
   * ESLint rule category. Defaults to problem.
   */
  type?: 'problem' | 'suggestion'

  /**
   * JSON Schema for the rule options. Defaults to an empty schema.
   */
  schema?: TSESLint.RuleMetaData<MessageIds>['schema']

  /**
   * Default option tuple merged into the options supplied by ESLint.
   */
  defaultOptions: Options

  /**
   * Diagnostic message templates keyed by their message IDs.
   */
  messages: Record<MessageIds, string>

  /**
   * Inspect a recognized API call and report diagnostics through ESLint.
   *
   * @param call Static facts about the call.
   * @param analyzer Analyzer for the current source file and settings.
   * @param context ESLint context used to report diagnostics.
   * @param options Rule options with defaults applied.
   * @returns No value. Diagnostics are reported through the context.
   */
  check: (
    call: ApiCall,
    analyzer: ApiAnalyzer,
    context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
    options: Options,
  ) => void
}
