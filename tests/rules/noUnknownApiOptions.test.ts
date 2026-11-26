import { rules } from '../../src/rules'
import { createRuleTester, registerToolWithOptions } from '../helpers'

const tester = createRuleTester()

tester.run('no-unknown-api-options', rules['no-unknown-api-options'], {
  valid: [
    registerToolWithOptions('signal: controller.signal, exposedTo: []'),
    'document.modelContext.getTools({fromOrigins: []})',
    'document.modelContext.executeTool(tool, {}, {signal})',
    registerToolWithOptions('...options'),
    {
      code: registerToolWithOptions('custom: true'),
      options: [{ allowOptions: ['custom'] }],
    },
    'document.modelContext.registerTool(...args, {invalid: true})',
  ],
  invalid: [
    {
      code: registerToolWithOptions('abortSignal: controller.signal'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: registerToolWithOptions('fromOrigins: []'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: 'document.modelContext.getTools({exposedTo: []})',
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: 'document.modelContext.executeTool(tool, {}, {exposedTo: []})',
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: registerToolWithOptions('...options, signall: signal'),
      errors: [{ messageId: 'unknown' }],
    },
  ],
})
