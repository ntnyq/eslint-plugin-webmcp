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

const register = (annotations: string) =>
  `document.modelContext.registerTool({ annotations: ${annotations} })`

for (const {
  target,
  supportsDebugging,
  requiresJsonText,
  supportsOutputSchema,
  requiresNativeTool,
} of targets) {
  const tester = new RuleTester({
    languageOptions: { parser },
    settings: { webmcp: { target } },
  })

  tester.run(
    `${target}: no-unknown-tool-properties`,
    rules['no-unknown-tool-properties'],
    {
      valid: [
        'document.modelContext.registerTool({inputSchema: {}})',
        ...(supportsOutputSchema
          ? ['document.modelContext.registerTool({outputSchema: {}})']
          : []),
        {
          code: 'document.modelContext.registerTool({outputSchema: {}})',
          options: [{ allowProperties: ['outputSchema'] }],
        },
      ],
      invalid: supportsOutputSchema
        ? []
        : [
            {
              code: 'document.modelContext.registerTool({outputSchema: {}})',
              errors: [
                {
                  messageId: 'unknown',
                  data: { name: 'outputSchema', target },
                },
              ],
            },
          ],
    },
  )

  tester.run(`${target}: valid-output-schema`, rules['valid-output-schema'], {
    valid: [
      'document.modelContext.registerTool({})',
      'document.modelContext.registerTool({outputSchema: undefined})',
      'document.modelContext.registerTool({outputSchema: {type: "object"}})',
      'document.modelContext.registerTool({outputSchema: unknownSchema})',
      ...(supportsOutputSchema
        ? []
        : ['null', '1n', '{const: 1n}'].map(
            schema =>
              `document.modelContext.registerTool({outputSchema: ${schema}})`,
          )),
      ...(supportsOutputSchema
        ? []
        : [
            {
              code: 'document.modelContext.registerTool({outputSchema: {type: "made-up"}})',
              options: [{ mode: 'json-schema', dialect: '2020-12' }] as const,
            },
          ]),
    ],
    invalid: supportsOutputSchema
      ? [
          {
            code: 'document.modelContext.registerTool({outputSchema: null})',
            errors: [{ messageId: 'object' }],
          },
          {
            code: 'document.modelContext.registerTool({outputSchema: {const: 1n}})',
            errors: [{ messageId: 'serialization' }],
          },
          {
            code: 'document.modelContext.registerTool({outputSchema: {type: "made-up"}})',
            options: [{ mode: 'json-schema', dialect: '2020-12' }] as const,
            errors: [{ messageId: 'schema' }],
          },
        ]
      : [],
  })

  tester.run(
    `${target}: valid-registered-tool`,
    rules['valid-registered-tool'],
    {
      valid: [
        'document.modelContext.executeTool(tool)',
        'const context = document.modelContext; context.executeTool(tool)',
        'const tool = findTool(); document.modelContext.executeTool(tool)',
        'const tools = await document.modelContext.getTools(); document.modelContext.executeTool(tools[0])',
        'const [tool] = await document.modelContext.getTools(); document.modelContext.executeTool(tool)',
        'document.modelContext.executeTool(await findTool())',
        'import { tool } from "./tools"; document.modelContext.executeTool(tool)',
        'let tool = {}; tool = findTool(); document.modelContext.executeTool(tool)',
        'const tool = {}; consume(tool); document.modelContext.executeTool(tool)',
        'const tool = []; consume(tool); document.modelContext.executeTool(tool)',
        'const tool = []; tool.name = "search"; document.modelContext.executeTool(tool)',
        'const tool = {}; function f() { document.modelContext.executeTool(tool) }',
        'function f(document) { document.modelContext.executeTool({}) }',
        'function f(globalThis) { globalThis.document.modelContext.executeTool({}) }',
        'other.executeTool({})',
        'document.modelContext.executeTool()',
        'document.modelContext.executeTool(...args)',
        'const {executeTool} = document.modelContext; executeTool({})',
        'document.modelContext.executeTool.call(document.modelContext, {})',
        ...(requiresNativeTool
          ? []
          : [
              'document.modelContext.executeTool({...tool})',
              'document.modelContext.executeTool({__proto__: tool})',
              'document.modelContext.executeTool({name: "search", description: "Search", window, origin})',
            ]),
      ],
      invalid: [
        ...[
          'document.modelContext.executeTool([])',
          'document.modelContext.executeTool([unknown, ...items])',
          'const tool = []; document.modelContext.executeTool(tool satisfies object)',
        ].map(code => ({
          code,
          errors: requiresNativeTool
            ? [{ messageId: 'native' as const }]
            : ['name', 'description', 'window', 'origin'].map(property => ({
                messageId: 'missing' as const,
                data: { property },
              })),
        })),
        ...["'search'", 'null', 'undefined', '42', 'false', '1n'].map(
          value => ({
            code: `document.modelContext.executeTool(${value})`,
            errors: [
              {
                messageId: requiresNativeTool
                  ? ('native' as const)
                  : ('invalid' as const),
              },
            ],
          }),
        ),
        ...(requiresNativeTool
          ? [
              '{}',
              '{name: "search", description: "Search", window, origin}',
              '{...tool}',
              '{...tool, name: "search"}',
              '{__proto__: Tool.prototype}',
              '{get name() { return tool.name }}',
              '{[dynamic]: value}',
              '[tool]',
              '() => tool',
              'function() {}',
              'class {}',
              '/tool/',
            ].map(value => ({
              code: `document.modelContext.executeTool(${value})`,
              errors: [{ messageId: 'native' as const }],
            }))
          : [
              {
                code: 'document.modelContext.executeTool({})',
                errors: Array.from({ length: 4 }, () => ({
                  messageId: 'missing' as const,
                })),
              },
              {
                code: 'document.modelContext.executeTool({name: "search", description: "Search", origin})',
                errors: [
                  {
                    messageId: 'missing' as const,
                    data: { property: 'window' },
                  },
                ],
              },
              {
                code: 'document.modelContext.executeTool({name: "search", description: "Search", window, origin: undefined})',
                errors: [
                  {
                    messageId: 'missing' as const,
                    data: { property: 'origin' },
                  },
                ],
              },
            ]),
        ...(requiresNativeTool
          ? [
              'const tool = {...discovered}; document.modelContext.executeTool(tool)',
              'const context = document.modelContext; context["executeTool"]({})',
              'window.document.modelContext?.executeTool?.({} as Tool)',
              'globalThis.document.modelContext.executeTool({} satisfies Tool)',
              'const tool = {__proto__: Tool.prototype}; document.modelContext.executeTool(tool!)',
            ].map(code => ({
              code,
              errors: [{ messageId: 'native' as const }],
            }))
          : []),
      ],
    },
  )

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
