import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import plugin, { createConfig } from '../src'
import { targets } from './fixtures/profiles'

describe('profile integration', () => {
  it('isolates output schemas and native Tool diagnostics across targets and presets', () => {
    const linter = new Linter()
    const code = `
      document.modelContext.registerTool({name: 'inspect', description: 'Inspect state', execute() {}, outputSchema: null})
      document.modelContext.executeTool({name: 'inspect', description: 'Inspect state', window, origin}, {})
    `

    for (const preset of ['recommended', 'strict'] as const) {
      for (const {
        target,
        supportsOutputSchema,
        requiresNativeTool,
        requiresJsonText,
      } of [...targets, ...targets.toReversed()]) {
        const expected: { ruleId: string; messageId: string }[] = []

        if (supportsOutputSchema) {
          expected.push({
            ruleId: 'webmcp/valid-output-schema',
            messageId: 'object',
          })
        } else if (preset === 'strict') {
          expected.push({
            ruleId: 'webmcp/no-unknown-tool-properties',
            messageId: 'unknown',
          })
        }

        if (requiresNativeTool) {
          expected.push({
            ruleId: 'webmcp/valid-registered-tool',
            messageId: 'native',
          })
        }

        if (requiresJsonText) {
          expected.push({
            ruleId: 'webmcp/no-incompatible-execute-arguments',
            messageId: 'text',
          })
        }

        expect(
          linter
            .verify(code, createConfig({ target, preset }))
            .map(message => ({
              ruleId: message.ruleId,
              messageId: message.messageId,
            })),
        ).toStrictEqual(expected)
      }
    }
  })

  it('uses the November 24 draft for both presets and manual configurations', () => {
    for (const config of [
      plugin.configs.recommended,
      plugin.configs.strict,
      createConfig(),
    ]) {
      expect(config.settings?.['webmcp']).toStrictEqual({
        target: 'draft-2026-11-24',
      })
    }

    expect(
      new Linter().verify(
        'document.modelContext.addEventListener("toolactivated", refresh)',
        {
          plugins: { webmcp: plugin },
          rules: { 'webmcp/no-unknown-model-context-events': 'error' },
        },
      ),
    ).toStrictEqual([])
    expect(
      new Linter()
        .verify('document.modelContext.registerTool({outputSchema: null})', {
          plugins: { webmcp: plugin },
          rules: { 'webmcp/valid-output-schema': 'error' },
        })
        .map(message => message.messageId),
    ).toStrictEqual(['object'])
    expect(
      new Linter()
        .verify(
          'document.modelContext.executeTool({name: "inspect", description: "Inspect state", window, origin}); document.modelContext.waitForToolsUntil()',
          {
            plugins: { webmcp: plugin },
            rules: {
              'webmcp/valid-registered-tool': 'error',
              'webmcp/require-api-arguments': 'error',
            },
          },
        )
        .map(message => message.messageId),
    ).toStrictEqual(['native', 'promise'])
  })

  it.each(targets)(
    'scopes tool readiness checks to $target',
    ({ target, supportsWaitForToolsUntil }) => {
      const code = `
        const context = document.modelContext
        context["waitForToolsUntil"]()
        const { waitForToolsUntil } = context
        waitForToolsUntil(pending)
        navigator.modelContext.waitForToolsUntil(pending)
        context.waitForToolsUntil(pending)
        context.waitForToolsUntil({ then: resolve => resolve() })
        context.waitForToolsUntil(undefined)
        context.waitForToolsUntil(...args)
        document.modelContext.waitForToolsUntil.call(document.modelContext, pending)
        document.modelContext.waitForToolsUntil.bind(document.modelContext)(pending)
        const escaped = document.modelContext
        use(escaped)
        escaped.waitForToolsUntil()
        function useOther(document) { document.modelContext.waitForToolsUntil() }
        other.waitForToolsUntil()
      `

      expect(
        new Linter()
          .verify(code, createConfig({ target, preset: 'strict' }))
          .map(({ ruleId, messageId }) => [ruleId, messageId]),
      ).toStrictEqual(
        supportsWaitForToolsUntil
          ? [
              ['webmcp/require-api-arguments', 'promise'],
              ['webmcp/no-unbound-api-call', 'unbound'],
              ['webmcp/no-unsupported-api', 'legacy'],
            ]
          : [],
      )
    },
  )

  it('keeps diagnostics isolated when switching between old and new targets', () => {
    const linter = new Linter()
    const code = `
      document.modelContext.registerTool({ name: 'inspect', description: 'Inspect state', execute() {}, annotations: { debugging: false } })
      document.modelContext.addEventListener('toolactivated', refresh)
      document.modelContext.executeTool(tool, {})
    `

    for (const { target, supportsDebugging, requiresJsonText } of [
      ...targets,
      ...targets.toReversed(),
    ]) {
      expect(
        linter
          .verify(code, createConfig({ target, preset: 'strict' }))
          .map(message => message.messageId),
      ).toStrictEqual([
        ...(supportsDebugging ? [] : ['unknown', 'unknown']),
        ...(requiresJsonText ? ['text'] : []),
      ])
    }
  })
})
