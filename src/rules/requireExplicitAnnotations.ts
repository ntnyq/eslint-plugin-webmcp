import {
  ANNOTATIONS,
  DEFAULT_EXPLICIT_ANNOTATION_FIELDS,
  PROFILES,
} from '../constants'
import {
  createApiRule,
  getField,
  isDefinition,
  readObject,
  readValue,
} from '../utils'

/**
 * Check that configured annotation fields supported by the target are present.
 */
export const requireExplicitAnnotations = createApiRule({
  name: 'require-explicit-annotations',
  description: 'Require explicit evaluation of configured tool hints.',
  type: 'suggestion',
  defaultOptions: [{ fields: [...DEFAULT_EXPLICIT_ANNOTATION_FIELDS] }],
  schema: [
    {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string', enum: ANNOTATIONS },
          minItems: 1,
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    missing: 'Explicitly evaluate the "{{name}}" annotation for this tool.',
  },
  check(call, analyzer, context, [options]) {
    if (!isDefinition(call) || !call.toolNode) {
      return
    }

    const field = getField(call.tool, 'annotations')
    const object =
      field.kind === 'known'
        ? readObject(analyzer.source, field.node)
        : undefined
    const value =
      field.kind === 'known'
        ? readValue(analyzer.source, field.node)
        : undefined
    const fields = options.fields.filter(name =>
      PROFILES[analyzer.settings.target].annotations.includes(name),
    )

    for (const name of fields) {
      const annotation = getField(object, name)
      const hint =
        annotation.kind === 'known'
          ? readValue(analyzer.source, annotation.node)
          : undefined

      if (
        field.kind === 'missing' ||
        (value?.kind === 'known' &&
          (value.value === null || value.value === undefined)) ||
        annotation.kind === 'missing' ||
        (hint?.kind === 'known' && hint.value === undefined)
      ) {
        context.report({
          node: field.kind === 'known' ? field.node : call.toolNode,
          messageId: 'missing',
          data: { name },
        })
      }
    }
  },
})
