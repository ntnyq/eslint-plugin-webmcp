import { rules } from '../../src/rules'
import { createRuleTester, registerToolWithOptions } from '../helpers'

const tester = createRuleTester()

tester.run('valid-abort-signal', rules['valid-abort-signal'], {
  valid: [
    registerToolWithOptions('signal: controller.signal'),
    registerToolWithOptions('signal: undefined'),
    registerToolWithOptions('signal: customSignal()'),
    registerToolWithOptions('signal: AbortSignal.timeout(1000)'),
    registerToolWithOptions('signal: new CustomSignal()'),
    'function f(AbortController) { document.modelContext.registerTool(tool, {signal: new AbortController()}) }',
    'document.modelContext.executeTool(tool, {}, {signal: controller.signal})',
    registerToolWithOptions('signal: false, ...unknown'),
  ],
  invalid: [
    ...[
      'false',
      'null',
      '42',
      "'signal'",
      '{}',
      '[]',
      'new AbortController()',
      '() => controller.signal',
    ].map(signal => ({
      code: registerToolWithOptions(`signal: ${signal}`),
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: 'document.modelContext.executeTool(tool, {}, {signal: false})',
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: 'const controller = new AbortController(); document.modelContext.registerTool(tool, {signal: controller})',
      errors: [{ messageId: 'invalid' }],
    },
  ],
})
