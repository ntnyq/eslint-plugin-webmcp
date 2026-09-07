import { ESLintUtils } from '@typescript-eslint/utils'
import type { TSESLint } from '@typescript-eslint/utils'
import { getAnalyzer } from './analysis/api'
import type { ApiAnalyzer, ApiCall } from './analysis/api'

export interface RuleDocs {
  recommended?: 'error' | 'warn'
  strict?: 'error' | 'warn'
}

// oxlint-disable-next-line new-cap -- RuleCreator is the upstream factory name.
const createRule = ESLintUtils.RuleCreator<RuleDocs>(
  name =>
    `https://github.com/ntnyq/eslint-plugin-webmcp/blob/main/docs/rules/${name}.md`,
)

export function createApiRule<
  Options extends readonly unknown[] | [],
  MessageIds extends string,
>(definition: {
  name: string
  description: string
  type?: 'problem' | 'suggestion'
  recommended?: 'error' | 'warn'
  strict?: 'error' | 'warn'
  schema?: TSESLint.RuleMetaData<MessageIds>['schema']
  defaultOptions: Options
  messages: Record<MessageIds, string>
  check: (
    call: ApiCall,
    analyzer: ApiAnalyzer,
    context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
    options: Options,
  ) => void
}) {
  return createRule<Options, MessageIds>({
    name: definition.name,
    meta: {
      type: definition.type ?? 'problem',
      docs: {
        description: definition.description,
        ...(definition.recommended
          ? { recommended: definition.recommended }
          : {}),
        ...(definition.strict ? { strict: definition.strict } : {}),
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
