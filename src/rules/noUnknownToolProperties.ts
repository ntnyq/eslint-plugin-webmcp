import { PROFILES } from '../constants'
import { createApiRule, isDefinition, stringListOption } from '../utils'

/**
 * Report definition fields absent from the chosen target and allowProperties
 * list.
 */
export const noUnknownToolProperties = createApiRule({
  name: 'no-unknown-tool-properties',
  description: 'Catch unrecognized tool definition properties.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ allowProperties: [] as string[] }],
  schema: stringListOption('allowProperties'),
  messages: {
    unknown:
      'Tool property "{{name}}" is not declared by {{target}} and may be ignored.',
  },
  check(call, analyzer, context, [options]) {
    if (!isDefinition(call)) {
      return
    }

    for (const [name, property] of call.tool?.properties ?? []) {
      if (
        !PROFILES[analyzer.settings.target].toolProperties.includes(name) &&
        !options.allowProperties.includes(name)
      ) {
        context.report({
          node: property.key,
          messageId: 'unknown',
          data: { name, target: analyzer.settings.target },
        })
      }
    }
  },
})
