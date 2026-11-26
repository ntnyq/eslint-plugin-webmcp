import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('no-empty-description', rules['no-empty-description'], {
  valid: [
    registerTool(`description: '搜索商品'`),
    registerTool('description: description'),
    registerTool('description: 42'),
    registerTool(`description: '', ...unknown`),
  ],
  invalid: ['', ' ', '\t\n', '\u3000'].map(description => ({
    code: registerTool(`description: ${JSON.stringify(description)}`),
    errors: [{ messageId: 'empty' as const }],
  })),
})
