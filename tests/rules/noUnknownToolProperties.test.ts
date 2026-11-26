import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('no-unknown-tool-properties', rules['no-unknown-tool-properties'], {
  valid: [
    registerTool('name, description, title, execute, inputSchema, annotations'),
    registerTool('...unknown'),
    {
      code: registerTool('custom: true'),
      options: [{ allowProperties: ['custom'] }],
    },
  ],
  invalid: [
    {
      code: registerTool('input_schema: {}'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: registerTool('signal: controller.signal'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: registerTool('...unknown, input_schema: {}'),
      errors: [{ messageId: 'unknown' }],
    },
  ],
})

for (const { target, supportsOutputSchema } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
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
}
