import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()
const chrome = { webmcp: { target: 'chrome-2026-09-01' } }

tester.run('require-api-arguments', rules['require-api-arguments'], {
  valid: [
    'document.modelContext.getTools()',
    'document.modelContext.executeTool(tool)',
    'document.modelContext.registerTool(undefined)',
    'document.modelContext.registerTool(...args)',
    { code: 'document.modelContext.executeTool(...args)', settings: chrome },
    { code: "document.modelContext.executeTool(tool, '{}')", settings: chrome },
  ],
  invalid: [
    {
      code: 'document.modelContext.registerTool()',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'document.modelContext.executeTool()',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'document.modelContext.executeTool(tool)',
      settings: chrome,
      errors: [{ messageId: 'input' }],
    },
  ],
})

for (const { target, requiresJsonText } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
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
}
