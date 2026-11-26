import type { ESLint, Linter } from 'eslint'

/**
 * Identifiers for the fixed upstream API snapshots supported by the plugin.
 */
export type WebMcpTarget =
  | 'draft-2026-09-04'
  | 'chrome-2026-09-01'
  | 'draft-2026-10-13'
  | 'chrome-2026-10-14'
  | 'draft-2026-11-02'
  | 'chrome-2026-11-07'
  | 'draft-2026-11-24'
  | 'chrome-2026-11-26'

/**
 * Built-in ESLint configuration presets.
 */
export type WebMcpPreset = 'recommended' | 'strict'

/**
 * Options used to create a WebMCP flat config.
 */
export interface WebMcpConfigOptions {
  /**
   * API snapshot to lint against. Defaults to the current draft profile.
   */
  target?: WebMcpTarget

  /**
   * Preset that determines which rules and severities to enable.
   */
  preset?: WebMcpPreset

  /**
   * File globs to which ESLint applies the configuration.
   */
  files?: string[]
}

/**
 * An explicitly trusted tool-definition factory, identified by its import
 * binding.
 */
export interface WebMcpWrapper {
  /**
   * Module specifier used by the wrapper’s named import.
   */
  module: string

  /**
   * Original exported name of the wrapper, before local import aliasing.
   */
  imported: string

  /**
   * Zero-based position of the tool definition in the wrapper call.
   */
  toolArgument: number

  /**
   * The analysis performed on calls to this wrapper.
   */
  kind: 'definition'
}

/**
 * WebMCP settings read from an ESLint configuration.
 */
export interface WebMcpSettings {
  /**
   * API snapshot to lint against. Defaults to the current draft profile.
   */
  target?: WebMcpTarget

  /**
   * Named imports trusted to accept WebMCP tool definitions.
   */
  wrappers?: WebMcpWrapper[]
}

/**
 * Native ESLint types keep consumer configs compatible with ESLint 9 and 10.
 */
export interface WebMcpPlugin extends ESLint.Plugin {
  /**
   * Registered WebMCP rules keyed by their unprefixed IDs.
   */
  rules: NonNullable<ESLint.Plugin['rules']>

  /**
   * Ready-to-use flat configs keyed by preset.
   */
  configs: Record<WebMcpPreset, Linter.Config>
}
