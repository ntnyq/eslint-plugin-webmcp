import type { TSESTree } from '@typescript-eslint/utils'
import type { ApiAnalyzer, ApiCall } from '../analysis/api'
import { getKey, isGlobal, unwrap } from '../analysis/bindings'
import {
  readObject,
  readString,
  readValue,
  resolveExpression,
} from '../analysis/static'
import { createApiRule, stringListOption } from '../createRule'
import { API_METHODS, API_OPTIONS, PROFILES } from '../profiles'

export function isCurrentCall(call: ApiCall): boolean {
  return (
    call.receiver === 'document' &&
    call.bound &&
    API_METHODS.includes(call.method)
  )
}

function getOrigins(call: ApiCall): TSESTree.Node | undefined {
  if (!isCurrentCall(call)) {
    return undefined
  }
  const originOption = { registerTool: 'exposedTo', getTools: 'fromOrigins' }
  if (call.method !== 'registerTool' && call.method !== 'getTools') {
    return undefined
  }
  return call.options?.properties.get(originOption[call.method])?.value
}

function getOriginEntries(
  analyzer: ApiAnalyzer,
  node: TSESTree.Node,
): (TSESTree.Expression | null)[] {
  const expression = resolveExpression(analyzer.source, node)
  return expression.type === 'ArrayExpression'
    ? expression.elements.filter(
        (element): element is TSESTree.Expression | null =>
          element === null || element.type !== 'SpreadElement',
      )
    : []
}

function parseOrigin(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

export const requireApiArguments = createApiRule({
  name: 'require-api-arguments',
  description: 'Require mandatory WebMCP call arguments.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    missing: '{{method}} requires a tool argument.',
    input: '{{target}} requires a JSON text input argument for executeTool.',
  },
  check(call, analyzer, context) {
    if (
      isCurrentCall(call) &&
      call.method !== 'getTools' &&
      call.node.arguments.length === 0
    ) {
      context.report({
        node: call.node,
        messageId: 'missing',
        data: { method: call.method },
      })
    } else if (
      isCurrentCall(call) &&
      call.method === 'executeTool' &&
      PROFILES[analyzer.settings.target].executeInput ===
        'required-json-text' &&
      call.node.arguments.length === 1 &&
      call.node.arguments[0]?.type !== 'SpreadElement'
    ) {
      context.report({
        node: call.node,
        messageId: 'input',
        data: { target: analyzer.settings.target },
      })
    }
  },
})

export const noUnknownApiOptions = createApiRule({
  name: 'no-unknown-api-options',
  description: 'Catch unrecognized or misplaced API options.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ allowOptions: [] as string[] }],
  schema: stringListOption('allowOptions'),
  messages: {
    unknown:
      'Option "{{name}}" is not declared for {{method}} in {{target}} and may be ignored.',
  },
  check(call, analyzer, context, [options]) {
    if (!isCurrentCall(call)) {
      return
    }
    for (const [name, property] of call.options?.properties ?? []) {
      if (
        !API_OPTIONS[call.method]?.includes(name) &&
        !options.allowOptions.includes(name)
      ) {
        context.report({
          node: property.key,
          messageId: 'unknown',
          data: { name, method: call.method, target: analyzer.settings.target },
        })
      }
    }
  },
})

export const validAbortSignal = createApiRule({
  name: 'valid-abort-signal',
  description: 'Reject values that are definitely not AbortSignals.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'Pass an AbortSignal, such as controller.signal, as the signal option.',
  },
  check(call, analyzer, context) {
    const node =
      isCurrentCall(call) && call.method !== 'getTools'
        ? call.options?.properties.get('signal')?.value
        : undefined
    if (!node) {
      return
    }
    const expression = resolveExpression(analyzer.source, node)
    const fact = readValue(analyzer.source, expression)
    if (
      (fact.kind === 'known' && fact.value !== undefined) ||
      expression.type === 'ObjectExpression' ||
      expression.type === 'ArrayExpression' ||
      expression.type === 'ArrowFunctionExpression' ||
      expression.type === 'FunctionExpression' ||
      (expression.type === 'NewExpression' &&
        isGlobal(analyzer.source, expression.callee, 'AbortController'))
    ) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})

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
    const node = getOrigins(call)
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
    const node = getOrigins(call)
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

export const noPreabortedRegistrationSignal = createApiRule({
  name: 'no-preaborted-registration-signal',
  description: 'Avoid registering with an already-aborted signal.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: {
    aborted:
      'AbortSignal.abort() produces an already-aborted signal; this tool will not be registered.',
  },
  check(call, analyzer, context) {
    const node =
      isCurrentCall(call) && call.method === 'registerTool'
        ? call.options?.properties.get('signal')?.value
        : undefined
    if (!node) {
      return
    }
    const expression = resolveExpression(analyzer.source, node)
    if (expression.type !== 'CallExpression') {
      return
    }
    const callee = unwrap(expression.callee)
    if (
      callee.type === 'MemberExpression' &&
      getKey(callee) === 'abort' &&
      isGlobal(analyzer.source, callee.object, 'AbortSignal')
    ) {
      context.report({ node, messageId: 'aborted' })
    }
  },
})
