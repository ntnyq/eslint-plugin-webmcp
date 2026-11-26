import {
  createApiRule,
  getDefinitionProperty,
  getField,
  readObject,
  readValue,
  visitParameters,
} from '../utils'

/**
 * Report known input parameters with missing or blank descriptions.
 * Skip parameters whose descriptions might be provided by a schema reference.
 */
export const preferParameterDescriptions = createApiRule({
  name: 'prefer-parameter-descriptions',
  description: 'Describe statically known input parameters.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: { missing: 'Describe input parameter "{{name}}".' },
  check(call, analyzer, context) {
    const node = getDefinitionProperty(call, 'inputSchema')

    if (!node) {
      return
    }

    visitParameters(analyzer.source, node, (name, schema) => {
      const object = readObject(analyzer.source, schema)

      if (!object) {
        return
      }

      const hasReference = ['$ref', '$dynamicRef'].some(property => {
        const field = getField(object, property)

        if (field.kind !== 'known') {
          return field.kind === 'unknown'
        }

        const value = readValue(analyzer.source, field.node)

        return value.kind === 'unknown' || value.value !== undefined
      })

      if (hasReference) {
        return
      }

      const description = getField(object, 'description')
      const value =
        description.kind === 'known'
          ? readValue(analyzer.source, description.node)
          : undefined

      if (
        description.kind === 'missing' ||
        (value?.kind === 'known' &&
          (value.value === undefined ||
            (typeof value.value === 'string' &&
              value.value.trim().length === 0)))
      ) {
        context.report({
          node: description.kind === 'known' ? description.node : schema,
          messageId: 'missing',
          data: { name },
        })
      }
    })
  },
})
