import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import plugin, { createConfig } from '../src'
import type { WebMcpTarget } from '../src'
import { rules } from '../src/rules'

const targets: {
  target: WebMcpTarget
  supportsDebugging: boolean
  requiresJsonText: boolean
}[] = [
  {
    target: 'draft-2026-09-04',
    supportsDebugging: false,
    requiresJsonText: false,
  },
  {
    target: 'chrome-2026-09-01',
    supportsDebugging: false,
    requiresJsonText: true,
  },
  {
    target: 'draft-2026-10-13',
    supportsDebugging: true,
    requiresJsonText: false,
  },
  {
    target: 'chrome-2026-10-14',
    supportsDebugging: true,
    requiresJsonText: false,
  },
]

const register = (annotations: string) =>
  `document.modelContext.registerTool({ annotations: ${annotations} })`

for (const { target, supportsDebugging, requiresJsonText } of targets) {
  const tester = new RuleTester({
    languageOptions: { parser },
    settings: { webmcp: { target } },
  })

  tester.run(`${target}: valid-annotations`, rules['valid-annotations'], {
    valid: [
      register('{ readOnlyHint: true }'),
      register('{ ...unknown }'),
      'function f(document) { document.modelContext.registerTool({ annotations: { debugging: "false" } }) }',
      ...(supportsDebugging
        ? ['true', 'false', 'undefined', 'dynamic'].map(value =>
            register(`{ debugging: ${value} }`),
          )
        : []),
    ],
    invalid: [
      {
        code: register('{ debugging: "false" }'),
        errors: [{ messageId: supportsDebugging ? 'boolean' : 'unknown' }],
      },
      ...(supportsDebugging
        ? []
        : [
            {
              code: register('{ debugging: true }'),
              errors: [{ messageId: 'unknown' as const }],
            },
          ]),
    ],
  })

  tester.run(
    `${target}: require-explicit-annotations`,
    rules['require-explicit-annotations'],
    {
      valid: [
        ...[
          '{ debugging: false }',
          '{ debugging: dynamic }',
          '{ ...unknown }',
        ].map(annotations => ({
          code: register(annotations),
          options: [{ fields: ['debugging'] }] satisfies [{ fields: string[] }],
        })),
        ...(supportsDebugging
          ? []
          : [
              {
                code: register('{}'),
                options: [{ fields: ['debugging'] }] satisfies [
                  { fields: string[] },
                ],
              },
            ]),
      ],
      invalid: supportsDebugging
        ? ['{}', '{ debugging: undefined }', 'null', 'undefined'].map(
            annotations => ({
              code: register(annotations),
              options: [{ fields: ['debugging'] }],
              errors: [
                { messageId: 'missing' as const, data: { name: 'debugging' } },
              ],
            }),
          )
        : [],
    },
  )

  tester.run(
    `${target}: no-unknown-model-context-events`,
    rules['no-unknown-model-context-events'],
    {
      valid: [
        'document.modelContext.addEventListener("toolchange", refresh)',
        'document.modelContext.addEventListener(eventName, refresh)',
        'function f(document) { document.modelContext.addEventListener("custom", refresh) }',
        'other.addEventListener("custom", refresh)',
        {
          code: 'document.modelContext.addEventListener("custom", refresh)',
          options: [{ allowEvents: ['custom'] }],
        },
        ...(supportsDebugging
          ? [
              'const context = document.modelContext; context["addEventListener"]("toolactivated", refresh)',
              'document.modelContext?.removeEventListener("toolcancel", refresh)',
            ]
          : []),
      ],
      invalid: [
        {
          code: 'document.modelContext.addEventListener("toolchanged", refresh)',
          errors: [{ messageId: 'unknown' }],
        },
        ...(supportsDebugging
          ? []
          : ['toolactivated', 'toolcancel'].flatMap(event =>
              ['addEventListener', 'removeEventListener'].map(method => ({
                code: `document.modelContext.${method}("${event}", refresh)`,
                errors: [{ messageId: 'unknown' as const }],
              })),
            )),
      ],
    },
  )

  tester.run(
    `${target}: require-api-arguments`,
    rules['require-api-arguments'],
    {
      valid: [
        'document.modelContext.executeTool(tool, input)',
        'document.modelContext.executeTool(...args)',
        ...(requiresJsonText
          ? []
          : ['document.modelContext.executeTool(tool)']),
      ],
      invalid: [
        {
          code: 'document.modelContext.executeTool()',
          errors: [{ messageId: 'missing' }],
        },
        ...(requiresJsonText
          ? [
              {
                code: 'document.modelContext.executeTool(tool)',
                errors: [{ messageId: 'input' as const, data: { target } }],
              },
            ]
          : []),
      ],
    },
  )

  tester.run(
    `${target}: no-incompatible-execute-arguments`,
    rules['no-incompatible-execute-arguments'],
    {
      valid: [
        'document.modelContext.executeTool(tool, unknownInput)',
        'document.modelContext.executeTool(...args, "{}")',
        'function f(document) { document.modelContext.executeTool(tool, "{}") }',
        ...(requiresJsonText
          ? ['document.modelContext.executeTool(tool, "{}")']
          : [
              'document.modelContext.executeTool(tool)',
              'document.modelContext.executeTool(tool, undefined)',
              'document.modelContext.executeTool(tool, { query: "search" })',
              'const context = document.modelContext; context.executeTool(tool, {})',
            ]),
      ],
      invalid: (requiresJsonText
        ? ['{}', '[]']
        : ['"{}"', 'null', '42', 'true']
      ).map(input => ({
        code: `document.modelContext.executeTool(tool, ${input})`,
        errors: [
          { messageId: requiresJsonText ? 'text' : 'object', data: { target } },
        ],
      })),
    },
  )
}

describe('profile integration', () => {
  it('uses the October draft for both presets and manual configurations', () => {
    for (const config of [
      plugin.configs.recommended,
      plugin.configs.strict,
      createConfig(),
    ]) {
      expect(config.settings?.['webmcp']).toStrictEqual({
        target: 'draft-2026-10-13',
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
  })

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
