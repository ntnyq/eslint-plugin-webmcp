import { API_OPTIONS } from '../constants'
import { createApiRule, isCurrentCall, stringListOption } from '../utils'

/**
 * Report known option keys outside the method’s dictionary and allowOptions
 * list.
 */
export const noUnknownApiOptions = createApiRule({
  name: 'no-unknown-api-options',
  description: 'Catch unrecognized or misplaced API options.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ allowOptions: [] as string[] }],
  schema: stringListOption('allowOptions'),
  messages: {
    unknown:
      'Option "{{name}}" is not declared for {{method}} in {{target}} and may be ignored.',
  },
  check(call, analyzer, context, [options]) {
    if (!isCurrentCall(call, analyzer.settings.target)) {
      return
    }

    for (const [name, property] of call.options?.properties ?? []) {
      if (
        !API_OPTIONS[call.method]?.includes(name) &&
        !options.allowOptions.includes(name)
      ) {
        context.report({
          node: property.key,
          messageId: 'unknown',
          data: { name, method: call.method, target: analyzer.settings.target },
        })
      }
    }
  },
})
