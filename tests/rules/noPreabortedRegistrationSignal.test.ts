import { rules } from '../../src/rules'
import { createRuleTester, registerToolWithOptions } from '../helpers'

const tester = createRuleTester()

tester.run(
  'no-preaborted-registration-signal',
  rules['no-preaborted-registration-signal'],
  {
    valid: [
      registerToolWithOptions('signal: controller.signal'),
      registerToolWithOptions('signal: AbortSignal.timeout(1)'),
      'if (condition) controller.abort(); document.modelContext.registerTool(tool, {signal: controller.signal})',
      'document.modelContext.executeTool(tool, {}, {signal: AbortSignal.abort()})',
      'function f(AbortSignal) { document.modelContext.registerTool(tool, {signal: AbortSignal.abort()}) }',
    ],
    invalid: [
      {
        code: registerToolWithOptions('signal: AbortSignal.abort()'),
        errors: [{ messageId: 'aborted' }],
      },
      {
        code: 'const signal = AbortSignal.abort(); document.modelContext.registerTool(tool, {signal})',
        errors: [{ messageId: 'aborted' }],
      },
    ],
  },
)
