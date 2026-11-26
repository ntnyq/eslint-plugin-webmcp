import { ESLintUtils } from '@typescript-eslint/utils'
import type { TSESLint } from '@typescript-eslint/utils'
import { RULE_DOCS_BASE_URL } from '../constants'
import type { ApiRuleDefinition, RuleDocs } from '../types'
import { getAnalyzer } from './analysis/api'

/**
 * ESLint rule factory that adds a documentation URL for each rule ID.
 */
// oxlint-disable-next-line new-cap -- RuleCreator is the upstream factory name.
const createRule = ESLintUtils.RuleCreator<RuleDocs>(
  name => `${RULE_DOCS_BASE_URL}/${name}.md`,
)

/**
 * Build an ESLint rule that visits recognized WebMCP calls using the shared
 * analyzer.
 *
 * @template Options Rule option tuple.
 * @template MessageIds Diagnostic IDs available to the rule.
 * @param definition Rule metadata, defaults and call checker.
 * @returns An ESLint rule module with a CallExpression listener.
 */
export function createApiRule<
  Options extends readonly unknown[] | [],
  MessageIds extends string,
>(definition: ApiRuleDefinition<Options, MessageIds>) {
  return createRule<Options, MessageIds>({
    name: definition.name,
    meta: {
      type: definition.type ?? 'problem',
      docs: {
        description: definition.description,
        ...(definition.recommended
          ? {
              recommended: definition.recommended,
            }
          : {}),
        ...(definition.strict
          ? {
              strict: definition.strict,
            }
          : {}),
      },
      schema: definition.schema ?? [],
      messages: definition.messages,
    },
    defaultOptions: definition.defaultOptions,
    create(context, options) {
      const analyzer = getAnalyzer(
        context.sourceCode,
        context.settings['webmcp'],
      )

      return {
        CallExpression(node) {
          const call = analyzer.identify(node)

          if (call) {
            definition.check(call, analyzer, context, options)
          }
        },
      }
    },
  })
}

/**
 * Build a rule option schema for an object with one supported string-list key.
 *
 * @param name Key of the array option.
 * @returns The option schema, which permits only unique string entries.
 */
export function stringListOption(
  name: string,
): TSESLint.RuleMetaData<string>['schema'] {
  return [
    {
      type: 'object',
      properties: {
        [name]: { type: 'array', items: { type: 'string' }, uniqueItems: true },
      },
      additionalProperties: false,
    },
  ]
}
