import { PROFILES } from '../constants'
import { createApiRule, readString, stringListOption } from '../utils'

/**
 * Report event names absent from the chosen target and configured allowEvents
 * list.
 */
export const noUnknownModelContextEvents = createApiRule({
  name: 'no-unknown-model-context-events',
  description: 'Catch unrecognized native ModelContext event names.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ allowEvents: [] as string[] }],
  schema: stringListOption('allowEvents'),
  messages: {
    unknown:
      'Event "{{event}}" is not declared by {{target}}. Native events: {{events}}. Allow intentional custom events explicitly.',
  },
  check(call, analyzer, context, [options]) {
    if (
      call.receiver !== 'document' ||
      !call.bound ||
      !['addEventListener', 'removeEventListener'].includes(call.method)
    ) {
      return
    }

    const [node] = call.node.arguments
    const event = readString(analyzer.source, node)

    if (
      node &&
      event !== undefined &&
      !PROFILES[analyzer.settings.target].events.includes(event) &&
      !options.allowEvents.includes(event)
    ) {
      context.report({
        node,
        messageId: 'unknown',
        data: {
          event,
          target: analyzer.settings.target,
          events: PROFILES[analyzer.settings.target].events.join(', '),
        },
      })
    }
  },
})
