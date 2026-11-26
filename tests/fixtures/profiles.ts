import type { WebMcpTarget } from '../../src'

export const targets: {
  target: WebMcpTarget
  supportsDebugging: boolean
  requiresJsonText: boolean
  supportsOutputSchema: boolean
  requiresNativeTool: boolean
  supportsWaitForToolsUntil?: true
}[] = [
  {
    target: 'draft-2026-09-04',
    supportsDebugging: false,
    requiresJsonText: false,
    supportsOutputSchema: false,
    requiresNativeTool: false,
  },
  {
    target: 'chrome-2026-09-01',
    supportsDebugging: false,
    requiresJsonText: true,
    supportsOutputSchema: false,
    requiresNativeTool: false,
  },
  {
    target: 'draft-2026-10-13',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: false,
    requiresNativeTool: false,
  },
  {
    target: 'chrome-2026-10-14',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: false,
    requiresNativeTool: false,
  },
  {
    target: 'draft-2026-11-02',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: true,
    requiresNativeTool: false,
  },
  {
    target: 'chrome-2026-11-07',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: true,
    requiresNativeTool: true,
  },
  {
    target: 'draft-2026-11-24',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: true,
    requiresNativeTool: true,
    supportsWaitForToolsUntil: true,
  },
  {
    target: 'chrome-2026-11-26',
    supportsDebugging: true,
    requiresJsonText: false,
    supportsOutputSchema: true,
    requiresNativeTool: true,
    supportsWaitForToolsUntil: true,
  },
]
