import {
  createApiRule,
  getOriginEntries,
  getOrigins,
  parseOrigin,
  readString,
} from '../utils'

/**
 * Report credentials, paths, queries and fragments in origin-wide URL options.
 */
export const preferCanonicalOrigin = createApiRule({
  name: 'prefer-canonical-origin',
  description: 'Make origin-wide exposure explicit in URL options.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: {
    canonical:
      'This option matches the entire origin; credentials, paths, queries and fragments do not narrow its scope.',
  },
  check(call, analyzer, context) {
    const node = getOrigins(call, analyzer)

    if (!node) {
      return
    }

    for (const entry of getOriginEntries(analyzer, node)) {
      const origin = readString(analyzer.source, entry ?? undefined)
      const url = origin === undefined ? undefined : parseOrigin(origin)

      if (
        entry &&
        url &&
        url.origin !== 'null' &&
        (url.username ||
          url.password ||
          (url.pathname !== '/' && url.pathname !== '') ||
          url.search ||
          url.hash)
      ) {
        context.report({ node: entry, messageId: 'canonical' })
      }
    }
  },
})
