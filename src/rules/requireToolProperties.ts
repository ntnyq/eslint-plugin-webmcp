import {
  createApiRule,
  getField,
  isDefinition,
  readValue,
  resolveExpression,
} from '../utils'

/**
 * Check tool definitions for the required name, description and execute fields.
 */
export const requireToolProperties = createApiRule({
  name: 'require-tool-properties',
  description: 'Require the mandatory tool definition fields.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    missing: 'Tool definition is missing required property "{{property}}".',
    invalid:
      'A tool definition must be a dictionary with name, description and execute.',
  },
  check(call, analyzer, context) {
    if (!isDefinition(call) || !call.toolNode) {
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

    // Array elements cannot supply named dictionary members.
    const isArray =
      resolveExpression(analyzer.source, call.toolNode).type ===
      'ArrayExpression'

    for (const property of ['name', 'description', 'execute']) {
      const field = getField(call.tool, property)
      const value =
        field.kind === 'known'
          ? readValue(analyzer.source, field.node)
          : undefined

      if (
        isArray ||
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
