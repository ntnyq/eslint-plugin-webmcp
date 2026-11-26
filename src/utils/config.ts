import type { ESLint, Linter } from 'eslint'
import { DEFAULT_FILES } from '../constants'
import type { RuleDocs, WebMcpConfigOptions } from '../types'
import { resolveTarget } from './settings'

/**
 * Create an ESLint flat config using the plugin’s rule metadata.
 *
 * @param options Target, preset and optional file globs.
 * @param plugin Plugin instance registered by the config.
 * @param ruleRegistry Registered rules and their preset severity metadata.
 * @returns A flat config that enables rules for the chosen preset and target.
 * @throws {Error} If the target, preset or file globs are invalid.
 */
export function createFlatConfig(
  options: WebMcpConfigOptions,
  plugin: ESLint.Plugin,
  ruleRegistry: Record<string, { meta: { docs?: RuleDocs } }>,
): Linter.Config {
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

  for (const [ruleName, rule] of Object.entries(ruleRegistry)) {
    const severity =
      rule.meta.docs?.recommended ??
      (preset === 'strict' ? rule.meta.docs?.strict : undefined)

    if (severity) {
      enabled[`webmcp/${ruleName}`] = severity
    }
  }

  return {
    name: `webmcp/${preset}/${target}`,
    files: options.files ? [...options.files] : [...DEFAULT_FILES],
    plugins: { webmcp: plugin },
    settings: { webmcp: { target } },
    rules: enabled,
  }
}
