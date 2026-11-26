import type { WebMcpSettings, WebMcpTarget, WebMcpWrapper } from './types'

export const DEFAULT_TARGET: WebMcpTarget = 'draft-2026-11-24'
const TOOL_PROPERTIES = [
  'name',
  'title',
  'description',
  'inputSchema',
  'execute',
  'annotations',
]
const LEGACY_ANNOTATIONS = [
  'readOnlyHint',
  'untrustedContentHint',
  'consequentialHint',
]

export const ANNOTATIONS = [...LEGACY_ANNOTATIONS, 'debugging']

interface WebMcpProfile {
  executeInput: 'optional-object' | 'required-json-text'
  executeToolArgument: 'registered-tool' | 'native-tool'
  toolProperties: readonly string[]
  annotations: readonly string[]
  events: readonly string[]
  supportsWaitForToolsUntil?: true
}

const NATIVE_TOOL_PROFILE: WebMcpProfile = {
  executeInput: 'optional-object',
  executeToolArgument: 'native-tool',
  toolProperties: [...TOOL_PROPERTIES, 'outputSchema'],
  annotations: ANNOTATIONS,
  events: ['toolchange', 'toolactivated', 'toolcancel'],
}

const TOOL_READINESS_PROFILE: WebMcpProfile = {
  ...NATIVE_TOOL_PROFILE,
  supportsWaitForToolsUntil: true,
}

export const PROFILES: Readonly<Record<WebMcpTarget, WebMcpProfile>> = {
  'draft-2026-09-04': {
    executeInput: 'optional-object',
    executeToolArgument: 'registered-tool',
    toolProperties: TOOL_PROPERTIES,
    annotations: LEGACY_ANNOTATIONS,
    events: ['toolchange'],
  },
  'chrome-2026-09-01': {
    executeInput: 'required-json-text',
    executeToolArgument: 'registered-tool',
    toolProperties: TOOL_PROPERTIES,
    annotations: LEGACY_ANNOTATIONS,
    events: ['toolchange'],
  },
  'draft-2026-10-13': {
    executeInput: 'optional-object',
    executeToolArgument: 'registered-tool',
    toolProperties: TOOL_PROPERTIES,
    annotations: ANNOTATIONS,
    events: ['toolchange', 'toolactivated', 'toolcancel'],
  },
  'chrome-2026-10-14': {
    executeInput: 'optional-object',
    executeToolArgument: 'registered-tool',
    toolProperties: TOOL_PROPERTIES,
    annotations: ANNOTATIONS,
    events: ['toolchange', 'toolactivated', 'toolcancel'],
  },
  'draft-2026-11-02': {
    executeInput: 'optional-object',
    executeToolArgument: 'registered-tool',
    toolProperties: [...TOOL_PROPERTIES, 'outputSchema'],
    annotations: ANNOTATIONS,
    events: ['toolchange', 'toolactivated', 'toolcancel'],
  },
  'chrome-2026-11-07': NATIVE_TOOL_PROFILE,
  'draft-2026-11-24': TOOL_READINESS_PROFILE,
  'chrome-2026-11-26': TOOL_READINESS_PROFILE,
}
export const API_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  registerTool: ['exposedTo', 'signal'],
  getTools: ['fromOrigins'],
  executeTool: ['signal'],
}
const API_METHODS = new Set(['registerTool', 'getTools', 'executeTool'])

export const LEGACY_METHODS = [
  'provideContext',
  'clearContext',
  'unregisterTool',
]

export function supportsApiMethod(
  target: WebMcpTarget,
  method: string,
): boolean {
  return (
    API_METHODS.has(method) ||
    (method === 'waitForToolsUntil' &&
      PROFILES[target].supportsWaitForToolsUntil === true)
  )
}

export function resolveTarget(target: unknown): WebMcpTarget {
  if (target === undefined) {
    return DEFAULT_TARGET
  }

  if (
    target === 'draft-2026-09-04' ||
    target === 'chrome-2026-09-01' ||
    target === 'draft-2026-10-13' ||
    target === 'chrome-2026-10-14' ||
    target === 'draft-2026-11-02' ||
    target === 'chrome-2026-11-07' ||
    target === 'draft-2026-11-24' ||
    target === 'chrome-2026-11-26'
  ) {
    return target
  }

  throw new Error(
    `webmcp: target must be one of ${Object.keys(PROFILES).join(', ')}.`,
  )
}

function isWrapper(wrapper: unknown): wrapper is WebMcpWrapper {
  return (
    typeof wrapper === 'object' &&
    wrapper !== null &&
    'module' in wrapper &&
    typeof wrapper.module === 'string' &&
    wrapper.module.length > 0 &&
    'imported' in wrapper &&
    typeof wrapper.imported === 'string' &&
    wrapper.imported.length > 0 &&
    'toolArgument' in wrapper &&
    typeof wrapper.toolArgument === 'number' &&
    Number.isSafeInteger(wrapper.toolArgument) &&
    wrapper.toolArgument >= 0 &&
    'kind' in wrapper &&
    wrapper.kind === 'definition'
  )
}

export function resolveSettings(settings: unknown): Required<WebMcpSettings> {
  if (settings === undefined) {
    return { target: DEFAULT_TARGET, wrappers: [] }
  }

  if (
    typeof settings !== 'object' ||
    settings === null ||
    Array.isArray(settings)
  ) {
    throw new Error('webmcp: settings.webmcp must be an object.')
  }

  const target = resolveTarget(
    'target' in settings ? settings.target : undefined,
  )
  const wrappers = 'wrappers' in settings ? settings.wrappers : []

  if (
    !Array.isArray(wrappers) ||
    wrappers.includes(undefined) ||
    !wrappers.every(wrapper => isWrapper(wrapper))
  ) {
    throw new Error(
      'webmcp: wrappers must contain module, imported, toolArgument and kind: "definition".',
    )
  }

  return { target, wrappers }
}
