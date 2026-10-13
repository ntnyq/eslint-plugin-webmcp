import { getField, readString, readValue } from '../analysis/static'
import { createApiRule, stringListOption } from '../createRule'
import { PROFILES } from '../profiles'
import { isCurrentCall } from './apiOptions'

export const validRegisteredTool = createApiRule({
  name: 'valid-registered-tool',
  description: 'Validate statically known RegisteredTool dictionaries.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'executeTool expects a RegisteredTool dictionary, not a tool name or primitive.',
    missing: 'RegisteredTool is missing required property "{{property}}".',
  },
  check(call, analyzer, context) {
    if (
      !isCurrentCall(call) ||
      call.method !== 'executeTool' ||
      !call.toolNode
    ) {
      return
    }
    const fact = readValue(analyzer.source, call.toolNode)
    if (
      fact.kind === 'known' &&
      (fact.value === null || typeof fact.value !== 'object')
    ) {
      context.report({ node: call.toolNode, messageId: 'invalid' })
      return
    }
    for (const property of ['name', 'description', 'window', 'origin']) {
      const field = getField(call.tool, property)
      const value =
        field.kind === 'known'
          ? readValue(analyzer.source, field.node)
          : undefined
      if (
        field.kind === 'missing' ||
        (value?.kind === 'known' && value.value === undefined)
      ) {
        context.report({
          node: field.kind === 'known' ? field.node : call.toolNode,
          messageId: 'missing',
          data: { property },
        })
      }
    }
  },
})

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
