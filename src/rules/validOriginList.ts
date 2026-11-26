import {
  createApiRule,
  getOriginEntries,
  getOrigins,
  parseOrigin,
  readObject,
  readValue,
} from '../utils'

/**
 * Check that known origin lists are iterable and their entries are absolute
 * URLs.
 */
export const validOriginList = createApiRule({
  name: 'valid-origin-list',
  description: 'Validate known origin lists and absolute URL strings.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    list: 'The origin list must be an iterable object of absolute URL strings.',
    url: '"{{origin}}" cannot be parsed as an absolute origin URL.',
  },
  check(call, analyzer, context) {
    const node = getOrigins(call, analyzer)

    if (!node) {
      return
    }

    const fact = readValue(analyzer.source, node)

    if (
      (fact.kind === 'known' &&
        fact.value !== undefined &&
        (fact.value === null || typeof fact.value !== 'object')) ||
      readObject(analyzer.source, node)?.complete
    ) {
      context.report({ node, messageId: 'list' })

      return
    }

    for (const entry of getOriginEntries(analyzer, node)) {
      const value = entry
        ? readValue(analyzer.source, entry)
        : { kind: 'known' as const, value: undefined }

      if (
        value.kind === 'known' &&
        (typeof value.value !== 'object' || value.value === null)
      ) {
        // Web IDL stringifies primitives; object coercion can execute user code.
        const origin = String(value.value)

        if (!parseOrigin(origin)) {
          context.report({
            node: entry ?? node,
            messageId: 'url',
            data: { origin },
          })
        }
      }
    }
  },
})
