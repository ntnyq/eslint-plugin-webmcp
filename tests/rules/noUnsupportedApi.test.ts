import { rules } from '../../src/rules'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()

tester.run('no-unsupported-api', rules['no-unsupported-api'], {
  valid: [
    'document.modelContext.getTools()',
    'custom.unregisterTool(name)',
    'function f(navigator) { navigator.modelContext.registerTool(tool) }',
    'document.modelContext.dispatchEvent(event)',
  ],
  invalid: [
    {
      code: 'navigator.modelContext.registerTool(tool)',
      errors: [{ messageId: 'legacy' }],
    },
    {
      code: 'window.navigator.modelContext.registerTool(tool)',
      errors: [{ messageId: 'legacy' }],
    },
    ...['provideContext', 'clearContext', 'unregisterTool'].map(method => ({
      code: `document.modelContext.${method}(tool)`,
      errors: [{ messageId: 'removed' as const }],
    })),
    {
      code: 'const context = navigator.modelContext; context.registerTool(tool)',
      errors: [{ messageId: 'legacy' }],
    },
  ],
})
