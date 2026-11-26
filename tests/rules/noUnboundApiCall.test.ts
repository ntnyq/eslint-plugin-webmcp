import { rules } from '../../src/rules'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()

tester.run('no-unbound-api-call', rules['no-unbound-api-call'], {
  valid: [
    'document.modelContext.registerTool(tool)',
    'const context = document.modelContext; context.registerTool(tool)',
    'const register = document.modelContext.registerTool.bind(document.modelContext); register(tool)',
    'document.modelContext.registerTool.call(document.modelContext, tool)',
    'document.modelContext.registerTool.apply(document.modelContext, [tool])',
    'const { registerTool } = custom; registerTool(tool)',
    'let register = document.modelContext.registerTool; register = custom; register(tool)',
  ],
  invalid: [
    {
      code: 'const register = document.modelContext.registerTool; register(tool); register(other)',
      errors: [{ messageId: 'unbound' }, { messageId: 'unbound' }],
    },
    {
      code: 'const register = document.modelContext.registerTool; register(tool)',
      errors: [{ messageId: 'unbound' }],
    },
    {
      code: 'const { registerTool } = document.modelContext; registerTool(tool)',
      errors: [{ messageId: 'unbound' }],
    },
    {
      code: 'const { registerTool: register } = document.modelContext; register(tool)',
      errors: [{ messageId: 'unbound' }],
    },
    {
      code: "const { ['getTools']: get } = document.modelContext; get()",
      errors: [{ messageId: 'unbound' }],
    },
    {
      code: '(0, document.modelContext.registerTool)(tool)',
      errors: [{ messageId: 'unbound' }],
    },
  ],
})
