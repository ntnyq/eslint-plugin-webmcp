/**
 * Fixed upstream snapshots; the target is never inferred from the environment.
 */
export type WebMcpTarget =
  | 'draft-2026-09-04'
  | 'chrome-2026-09-01'
  | 'draft-2026-10-13'
  | 'chrome-2026-10-14'

export type WebMcpPreset = 'recommended' | 'strict'

export interface WebMcpConfigOptions {
  target?: WebMcpTarget
  preset?: WebMcpPreset
  files?: string[]
}

/**
 * An explicitly trusted tool-definition factory, identified by its import binding.
 */
export interface WebMcpWrapper {
  module: string
  imported: string
  toolArgument: number
  kind: 'definition'
}

export interface WebMcpSettings {
  target?: WebMcpTarget
  wrappers?: WebMcpWrapper[]
}
