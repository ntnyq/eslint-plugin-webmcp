import { PROFILES } from '../constants'
import {
  createApiRule,
  getDefinitionProperty,
  readObject,
  readValue,
} from '../utils'

/**
 * Check that known annotations use supported names and boolean values.
 */
export const validAnnotations = createApiRule({
  name: 'valid-annotations',
  description: 'Use supported hint names and explicit boolean values.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: {
    unknown:
      'Annotation "{{name}}" is not declared by {{target}} and may be ignored.',
    boolean:
      'Write an explicit boolean for "{{name}}"; Web IDL coerces other values by truthiness.',
    dictionary:
      'Use an annotations dictionary with explicit boolean hint values.',
  },
  check(call, analyzer, context) {
    const node = getDefinitionProperty(call, 'annotations')

    if (!node) {
      return
    }

    const fact = readValue(analyzer.source, node)

    if (
      fact.kind === 'known' &&
      fact.value !== null &&
      fact.value !== undefined &&
      typeof fact.value !== 'object'
    ) {
      context.report({ node, messageId: 'dictionary' })

      return
    }

    for (const [name, property] of readObject(analyzer.source, node)
      ?.properties ?? []) {
      if (PROFILES[analyzer.settings.target].annotations.includes(name)) {
        const value = readValue(analyzer.source, property.value)

        if (
          value.kind === 'known' &&
          value.value !== undefined &&
          typeof value.value !== 'boolean'
        ) {
          context.report({
            node: property.value,
            messageId: 'boolean',
            data: { name },
          })
        }
      } else {
        context.report({
          node: property.key,
          messageId: 'unknown',
          data: { name, target: analyzer.settings.target },
        })
      }
    }
  },
})
