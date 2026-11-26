import { API_METHODS, DEFAULT_TARGET, PROFILES } from '../constants'
import type { WebMcpSettings, WebMcpTarget, WebMcpWrapper } from '../types'

/**
 * Check whether an API method is available in the selected snapshot.
 *
 * @param target API snapshot used for linting.
 * @param method ModelContext member name.
 * @returns Whether the snapshot supports the method.
 */
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

/**
 * Validate the configured target and supply the default when omitted.
 *
 * @param target Target value read from ESLint settings or config options.
 * @returns A supported API snapshot identifier.
 * @throws {Error} If the provided target is unsupported.
 */
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

/**
 * Check whether a wrapper setting specifies a usable named import and argument.
 *
 * @param wrapper Unvalidated wrapper setting.
 * @returns Whether the value satisfies the wrapper contract.
 */
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

/**
 * Validate WebMCP settings and supply defaults for omitted settings.
 *
 * @param settings Raw value of the ESLint webmcp setting.
 * @returns The selected target and validated wrapper list.
 * @throws {Error} If the settings, target or wrappers are invalid.
 */
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
