import parser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import plugin, { createConfig } from '../src'
import type { WebMcpConfigOptions } from '../src'
import { rules } from '../src/rules'

const validTool =
  'document.modelContext.registerTool({name: "search", description: "Search products", execute() { return "ok" }})'

describe('public plugin and config', () => {
  it('exports versioned metadata, all implemented rules and self-referencing presets', () => {
    expect(plugin.meta?.name).toBe('eslint-plugin-webmcp')
    expect(Object.keys(plugin.rules)).toHaveLength(25)
    expect(plugin.configs.recommended.plugins?.['webmcp']).toBe(plugin)
    expect(plugin.configs.strict.plugins?.['webmcp']).toBe(plugin)
    expect(plugin.configs.recommended.languageOptions).toBeUndefined()
    expect(plugin.configs.recommended.rules?.['webmcp/valid-tool-name']).toBe(
      'error',
    )
    expect(
      plugin.configs.recommended.rules?.['webmcp/valid-output-schema'],
    ).toBe('error')
    expect(plugin.configs.strict.rules?.['webmcp/no-unknown-api-options']).toBe(
      'warn',
    )
    expect(
      plugin.configs.strict.rules?.['webmcp/tool-name-convention'],
    ).toBeUndefined()
  })

  it('accepts correct JavaScript through actual ESLint Flat Config', () => {
    expect(
      new Linter().verify(validTool, plugin.configs.recommended),
    ).toStrictEqual([])
  })

  it('accepts TypeScript without project services or implicit parser changes', () => {
    const messages = new Linter().verify(
      validTool.replace('})', '} satisfies object)'),
      [
        plugin.configs.recommended,
        { files: ['**/*.ts'], languageOptions: { parser } },
      ],
      { filename: 'example.ts' },
    )
    expect(messages).toStrictEqual([])
  })

  it('keeps ordinary methods and shadowed globals outside all rules', () => {
    const messages = new Linter().verify(
      'const server = {registerTool(){}}; server.registerTool({}); function f(document) { document.modelContext.registerTool({}) }',
      plugin.configs.strict,
    )
    expect(messages).toStrictEqual([])
  })

  it('rejects unsupported target, preset and file options from JavaScript callers', () => {
    const badOptions: unknown[] = [
      { target: 'latest' },
      { preset: 'all' },
      { files: [] },
      { files: [123] },
    ]
    for (const options of badOptions) {
      expect(() => createConfig(options as WebMcpConfigOptions)).toThrow(
        'webmcp:',
      )
    }
  })

  it('rejects invalid manual settings even if the file contains no API calls', () => {
    const linter = new Linter()
    for (const settings of [
      { target: 'latest' },
      { wrappers: [{ module: '@app/webmcp' }] },
      null,
      [],
    ]) {
      expect(() =>
        linter.verify('const x = 1', [
          plugin.configs.recommended,
          { settings: { webmcp: settings } },
        ]),
      ).toThrow('webmcp:')
    }
  })

  it('creates independent target configurations and respects custom file globs', () => {
    const files = ['src/**/*.js']
    const config = createConfig({
      target: 'chrome-2026-09-01',
      preset: 'strict',
      files,
    })
    files.push('other/**/*.js')
    expect(config.files).toStrictEqual(['src/**/*.js'])
    expect(config.settings?.['webmcp']).toStrictEqual({
      target: 'chrome-2026-09-01',
    })
    expect(plugin.configs.recommended.settings?.['webmcp']).toStrictEqual({
      target: 'draft-2026-11-02',
    })
    expect(
      new Linter().verify('document.modelContext.registerTool({})', config, {
        filename: 'other/file.js',
      }),
    ).toStrictEqual([])
  })

  it('does not share analysis across target settings on repeated lint runs', () => {
    const linter = new Linter()
    const code = 'document.modelContext.executeTool(tool, "{}")'
    expect(linter.verify(code, createConfig())[0]?.ruleId).toBe(
      'webmcp/no-incompatible-execute-arguments',
    )
    expect(
      linter.verify(code, createConfig({ target: 'chrome-2026-09-01' })),
    ).toStrictEqual([])
    expect(linter.verify(code, createConfig())[0]?.ruleId).toBe(
      'webmcp/no-incompatible-execute-arguments',
    )
  })

  it('recognizes explicitly configured wrapper imports and their aliases', () => {
    const config = [
      plugin.configs.recommended,
      {
        settings: {
          webmcp: {
            wrappers: [
              {
                module: '@app/webmcp',
                imported: 'defineTool',
                toolArgument: 1,
                kind: 'definition',
              },
            ],
          },
        },
      },
    ]
    const linter = new Linter()
    const messages = linter.verify(
      'import {defineTool as define} from "@app/webmcp"; define("meta", {})',
      config,
    )
    expect(messages.map(message => message.ruleId)).toStrictEqual(
      Array.from({ length: 3 }, () => 'webmcp/require-tool-properties'),
    )
    expect(
      linter.verify(
        'import {defineTool as define} from "other"; define("meta", {})',
        config,
      ),
    ).toStrictEqual([])
    expect(
      linter.verify(
        'import {defineTool as define} from "@app/webmcp"; function f(define) { define("meta", {}) }',
        config,
      ),
    ).toStrictEqual([])
  })

  it('exposes no automatic fixes or suggestions that invent tool behavior', () => {
    for (const rule of Object.values(rules)) {
      expect(rule.meta.fixable).toBeUndefined()
      expect(rule.meta.hasSuggestions).toBeUndefined()
      expect(rule.meta.docs?.url).toMatch(/\/docs\/rules\//u)
    }
  })

  it('reports dictionary and serialized schema omissions through Flat Config', () => {
    const messages = new Linter().verify(
      `
        document.modelContext.registerTool([])
        document.modelContext.executeTool([])
        document.modelContext.registerTool({
          name: 'search', description: 'Search', execute() {},
          inputSchema: {$schema: 42}, outputSchema: {$schema: null},
        })
        document.modelContext.registerTool({
          name: 'find', description: 'Find', execute() {},
          inputSchema: {properties: {query: {$ref: undefined, description: undefined}}},
        })
      `,
      [
        plugin.configs.strict,
        {
          rules: {
            'webmcp/valid-input-schema': [
              'error',
              { mode: 'json-schema', dialect: '2020-12' },
            ],
            'webmcp/valid-output-schema': [
              'error',
              { mode: 'json-schema', dialect: '2020-12' },
            ],
          },
        },
      ],
    )
    expect(messages.map(message => message.messageId)).toStrictEqual([
      ...Array.from({ length: 7 }, () => 'missing'),
      'schema',
      'schema',
      'missing',
    ])
    expect(messages.filter(message => message.severity === 2)).toHaveLength(9)
    expect(messages.filter(message => message.severity === 1)).toHaveLength(1)
  })
})
