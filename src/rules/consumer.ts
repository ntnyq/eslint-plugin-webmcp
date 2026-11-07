import {
  getField,
  readString,
  readValue,
  resolveExpression,
} from '../analysis/static'
import { createApiRule, stringListOption } from '../createRule'
import { PROFILES } from '../profiles'
import { isCurrentCall } from './apiOptions'

export const validRegisteredTool = createApiRule({
  name: 'valid-registered-tool',
  description:
    'Validate executeTool dictionaries or native Tool arguments by target.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'executeTool expects a RegisteredTool dictionary, not a tool name or primitive.',
    missing: 'RegisteredTool is missing required property "{{property}}".',
    native:
      'executeTool expects a native Tool returned by getTools(); primitives, object literals and copies are not Tool instances.',
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
      PROFILES[analyzer.settings.target].executeToolArgument === 'native-tool'
    ) {
      const expression = resolveExpression(analyzer.source, call.toolNode)
      // A literal cannot carry the native interface brand, even with getters,
      // unknown spreads or Tool.prototype. Unresolved handles remain unknown.
      if (
        fact.kind === 'known' ||
        [
          'ObjectExpression',
          'ArrayExpression',
          'FunctionExpression',
          'ArrowFunctionExpression',
          'ClassExpression',
          'Literal',
        ].includes(expression.type)
      ) {
        context.report({ node: call.toolNode, messageId: 'native' })
      }
      return
    }
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

export const noIncompatibleExecuteArguments = createApiRule({
  name: 'no-incompatible-execute-arguments',
  description:
    'Use the executeTool input representation required by the target.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    object:
      '{{target}} expects an input object; do not pass JSON text or primitives.',
    text: '{{target}} expects JSON text; explicitly serialize the input object.',
  },
  check(call, analyzer, context) {
    if (
      call.receiver !== 'document' ||
      !call.bound ||
      call.method !== 'executeTool' ||
      call.node.arguments.some(
        (argument, index) => index <= 1 && argument.type === 'SpreadElement',
      )
    ) {
      return
    }
    const [, node] = call.node.arguments
    if (!node) {
      return
    }
    const fact = readValue(analyzer.source, node)
    const expression = resolveExpression(analyzer.source, node)
    if (PROFILES[analyzer.settings.target].executeInput === 'optional-object') {
      if (
        fact.kind === 'known' &&
        fact.value !== undefined &&
        (fact.value === null || typeof fact.value !== 'object')
      ) {
        context.report({
          node,
          messageId: 'object',
          data: { target: analyzer.settings.target },
        })
      }
    } else if (
      expression.type === 'ObjectExpression' ||
      expression.type === 'ArrayExpression'
    ) {
      context.report({
        node,
        messageId: 'text',
        data: { target: analyzer.settings.target },
      })
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
