import type { WebMcpSettings, WebMcpTarget, WebMcpWrapper } from './types'

export const DEFAULT_TARGET: WebMcpTarget = 'draft-2026-09-04'
export const TOOL_PROPERTIES = [
  'name',
  'title',
  'description',
  'inputSchema',
  'execute',
  'annotations',
]
export const ANNOTATIONS = [
  'readOnlyHint',
  'untrustedContentHint',
  'consequentialHint',
]
export const API_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  registerTool: ['exposedTo', 'signal'],
  getTools: ['fromOrigins'],
  executeTool: ['signal'],
}
export const API_METHODS = ['registerTool', 'getTools', 'executeTool']
export const LEGACY_METHODS = [
  'provideContext',
  'clearContext',
  'unregisterTool',
]

export function resolveTarget(target: unknown): WebMcpTarget {
  if (target === undefined) {
    return DEFAULT_TARGET
  }
  if (target === 'draft-2026-09-04' || target === 'chrome-2026-09-01') {
    return target
  }
  throw new Error(
    'webmcp: target must be "draft-2026-09-04" or "chrome-2026-09-01".',
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
    !wrappers.every(wrapper => isWrapper(wrapper))
  ) {
    throw new Error(
      'webmcp: wrappers must contain module, imported, toolArgument and kind: "definition".',
    )
  }
  return { target, wrappers }
}
