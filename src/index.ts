import type { Linter } from 'eslint'
import { name, version } from '../package.json'
import { rules } from './rules'
import type { WebMcpConfigOptions, WebMcpPlugin, WebMcpPreset } from './types'
import { createFlatConfig } from './utils'

export type {
  WebMcpConfigOptions,
  WebMcpPlugin,
  WebMcpPreset,
  WebMcpSettings,
  WebMcpTarget,
  WebMcpWrapper,
} from './types'

/**
 * Plugin metadata and rule registry shared by the generated configs.
 *
 * The native ESLint type assertion bridges the typescript-eslint context types.
 * The rules use sourceCode and are exercised against the native ESLint host.
 */
const plugin = {
  meta: { name, version },
  rules: rules as unknown as WebMcpPlugin['rules'],
}

/**
 * Create a parser-independent flat config for a fixed WebMCP API snapshot.
 *
 * @param options Target, preset and optional file globs.
 * @returns A standalone flat config referencing this plugin.
 * @throws {Error} If the target, preset or file globs are invalid.
 */
export function createConfig(options: WebMcpConfigOptions = {}): Linter.Config {
  return createFlatConfig(options, plugin, rules)
}

/**
 * The default recommended and strict flat configs.
 */
const configs: Record<WebMcpPreset, Linter.Config> = {
  recommended: createConfig(),
  strict: createConfig({ preset: 'strict' }),
}

/**
 * Published ESLint plugin with its built-in flat configs attached.
 */
const webmcp: WebMcpPlugin = Object.assign(plugin, { configs })

export default webmcp
