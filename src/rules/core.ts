import { isDefinition, isNativeMethod } from '../analysis/api'
import {
  getField,
  isDefinitelyNonCallable,
  readString,
  readValue,
} from '../analysis/static'
import { createApiRule } from '../createRule'
import { LEGACY_METHODS } from '../profiles'

export function isValidToolName(name: string): boolean {
  return name.length > 0 && name.length <= 128 && !/[^A-Za-z0-9_.-]/u.test(name)
}

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
    for (const property of ['name', 'description', 'execute']) {
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

export const validToolName = createApiRule({
  name: 'valid-tool-name',
  description: 'Validate static tool names against the target API.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'Tool names must contain 1–128 ASCII letters, digits, underscores, hyphens or dots.',
  },
  check(call, analyzer, context) {
    if (!isDefinition(call)) {
      return
    }
    const node = call.tool?.properties.get('name')?.value
    const name = readString(analyzer.source, node)
    if (node && name !== undefined && !isValidToolName(name)) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})

export const validExecute = createApiRule({
  name: 'valid-execute',
  description: 'Reject definitely non-callable execute values.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    invalid:
      'The execute property must be callable; an async keyword is not required.',
  },
  check(call, analyzer, context) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('execute')?.value
      : undefined
    const value = readValue(analyzer.source, node)
    if (
      node &&
      !(value.kind === 'known' && value.value === undefined) &&
      isDefinitelyNonCallable(analyzer.source, node)
    ) {
      context.report({ node, messageId: 'invalid' })
    }
  },
})

export const noEmptyDescription = createApiRule({
  name: 'no-empty-description',
  description: 'Require nonempty, non-whitespace tool descriptions.',
  type: 'suggestion',
  recommended: 'warn',
  defaultOptions: [],
  messages: {
    empty:
      'Describe what this tool does; its description is empty or whitespace-only.',
  },
  check(call, analyzer, context) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('description')?.value
      : undefined
    const description = readString(analyzer.source, node)
    if (node && description !== undefined && description.trim().length === 0) {
      context.report({ node, messageId: 'empty' })
    }
  },
})

export const noUnsupportedApi = createApiRule({
  name: 'no-unsupported-api',
  description: 'Report legacy WebMCP entry points and removed methods.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    legacy:
      '{{target}} uses document.modelContext; migrate the entry point and registration lifecycle together.',
    removed:
      '{{method}} is not supported by {{target}}. Registration lifetime is controlled by options.signal.',
  },
  check(call, analyzer, context) {
    if (!isNativeMethod(call)) {
      return
    }
    if (call.receiver === 'navigator') {
      context.report({
        node: call.node.callee,
        messageId: 'legacy',
        data: { target: analyzer.settings.target },
      })
    } else if (LEGACY_METHODS.includes(call.method)) {
      context.report({
        node: call.node.callee,
        messageId: 'removed',
        data: { target: analyzer.settings.target, method: call.method },
      })
    }
  },
})

export const noUnboundApiCall = createApiRule({
  name: 'no-unbound-api-call',
  description:
    'Keep the native ModelContext receiver when calling its methods.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    unbound:
      'Call {{method}} on its ModelContext receiver, or explicitly bind the method to that receiver.',
  },
  check(call, _analyzer, context) {
    if (isNativeMethod(call) && !call.bound) {
      context.report({
        node: call.node.callee,
        messageId: 'unbound',
        data: { method: call.method },
      })
    }
  },
})
