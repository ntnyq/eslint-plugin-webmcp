import { isDefinition } from '../analysis/api'
import { readObject, readValue } from '../analysis/static'
import { createApiRule, stringListOption } from '../createRule'
import { PROFILES } from '../profiles'

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
    const node = isDefinition(call)
      ? call.tool?.properties.get('annotations')?.value
      : undefined

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
