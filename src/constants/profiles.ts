import type { WebMcpProfile, WebMcpTarget } from '../types'

/**
 * API snapshot selected when no target is configured.
 */
export const DEFAULT_TARGET: WebMcpTarget = 'draft-2026-11-24'

/**
 * Properties accepted in the original tool definition dictionary.
 */
const TOOL_PROPERTIES = [
  'name',
  'title',
  'description',
  'inputSchema',
  'execute',
  'annotations',
]

/**
 * Tool annotation names supported by the September snapshots.
 */
const LEGACY_ANNOTATIONS = [
  'readOnlyHint',
  'untrustedContentHint',
  'consequentialHint',
]

/**
 * Tool annotation names supported by the October and later snapshots.
 */
export const ANNOTATIONS = [...LEGACY_ANNOTATIONS, 'debugging']

/**
 * Capabilities of the first snapshot that accepts native Tool handles.
 */
const NATIVE_TOOL_PROFILE: WebMcpProfile = {
  executeInput: 'optional-object',
  executeToolArgument: 'native-tool',
  toolProperties: [...TOOL_PROPERTIES, 'outputSchema'],
  annotations: ANNOTATIONS,
  events: ['toolchange', 'toolactivated', 'toolcancel'],
}

/**
 * Native Tool capabilities with waitForToolsUntil support.
 */
const TOOL_READINESS_PROFILE: WebMcpProfile = {
  ...NATIVE_TOOL_PROFILE,
  supportsWaitForToolsUntil: true,
}

/**
 * Capabilities of each supported upstream API snapshot.
 */
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

/**
 * Recognized option dictionary keys by API method.
 */
export const API_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  registerTool: ['exposedTo', 'signal'],
  getTools: ['fromOrigins'],
  executeTool: ['signal'],
}

/**
 * Methods shared by every supported API snapshot.
 */
export const API_METHODS = new Set(['registerTool', 'getTools', 'executeTool'])

/**
 * Methods removed from the supported WebMCP API snapshots.
 */
export const LEGACY_METHODS = [
  'provideContext',
  'clearContext',
  'unregisterTool',
]
