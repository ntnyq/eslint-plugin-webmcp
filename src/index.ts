import type { ESLint, Linter } from 'eslint'
import { name, version } from '../package.json'
import { resolveTarget } from './profiles'
import { rules } from './rules'
import type { WebMcpConfigOptions, WebMcpPreset } from './types'

export type {
  WebMcpConfigOptions,
  WebMcpPreset,
  WebMcpSettings,
  WebMcpTarget,
  WebMcpWrapper,
} from './types'

/**
 * Native ESLint types keep consumer configs compatible with ESLint 9 and 10.
 */
export interface WebMcpPlugin extends ESLint.Plugin {
  rules: NonNullable<ESLint.Plugin['rules']>
  configs: Record<WebMcpPreset, Linter.Config>
}

// typescript-eslint still describes removed context methods and a TS-specific AST.
// Our rules use sourceCode only. This single host boundary is exercised against
// actual ESLint 9/10; internal rule tests retain their precise message/options types.
const plugin = {
  meta: { name, version },
  rules: rules as unknown as WebMcpPlugin['rules'],
}

/**
 * Create a parser-independent Flat Config for a fixed WebMCP API snapshot.
 *
 * @param options Target, preset and optional file globs
 * @returns A standalone Flat Config referencing this plugin
 */
export function createConfig(options: WebMcpConfigOptions = {}): Linter.Config {
  const target = resolveTarget(options.target)
  const preset = options.preset ?? 'recommended'
  if (preset !== 'recommended' && preset !== 'strict') {
    throw new Error('webmcp: preset must be "recommended" or "strict".')
  }
  if (
    options.files !== undefined &&
    (!Array.isArray(options.files) ||
      options.files.length === 0 ||
      ![...options.files].every(
        file => typeof file === 'string' && file.length > 0,
      ))
  ) {
    throw new Error('webmcp: files must be a nonempty array of glob strings.')
  }
  const enabled: Linter.RulesRecord = {}
  for (const [ruleName, rule] of Object.entries(rules)) {
    const severity =
      rule.meta.docs?.recommended ??
      (preset === 'strict' ? rule.meta.docs?.strict : undefined)
    if (severity) {
      enabled[`webmcp/${ruleName}`] = severity
    }
  }
  return {
    name: `webmcp/${preset}/${target}`,
    files: options.files
      ? [...options.files]
      : ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { webmcp: plugin },
    settings: { webmcp: { target } },
    rules: enabled,
  }
}

const configs: Record<WebMcpPreset, Linter.Config> = {
  recommended: createConfig(),
  strict: createConfig({ preset: 'strict' }),
}

const webmcp: WebMcpPlugin = Object.assign(plugin, { configs })

export default webmcp
