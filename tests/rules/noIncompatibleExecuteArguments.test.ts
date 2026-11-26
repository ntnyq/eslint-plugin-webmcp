import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()
const chrome = { webmcp: { target: 'chrome-2026-09-01' } }

tester.run(
  'no-incompatible-execute-arguments',
  rules['no-incompatible-execute-arguments'],
  {
    valid: [
      'document.modelContext.executeTool(tool)',
      'document.modelContext.executeTool(tool, undefined)',
      'document.modelContext.executeTool(tool, {})',
      'document.modelContext.executeTool(tool, dynamic)',
      'document.modelContext.executeTool(...args, "{}")',
      {
        code: 'document.modelContext.executeTool(tool, "{}")',
        settings: chrome,
      },
      {
        code: 'document.modelContext.executeTool(tool, JSON.stringify({query: "text"}))',
        settings: chrome,
      },
    ],
    invalid: [
      ...['"{}"', 'false', 'null', '42'].map(input => ({
        code: `document.modelContext.executeTool(tool, ${input})`,
        errors: [{ messageId: 'object' as const }],
      })),
      {
        code: 'document.modelContext.executeTool(tool, {})',
        settings: chrome,
        errors: [{ messageId: 'text' }],
      },
      {
        code: 'document.modelContext.executeTool(tool, [])',
        settings: chrome,
        errors: [{ messageId: 'text' }],
      },
    ],
  },
)

for (const { target, requiresJsonText } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
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
