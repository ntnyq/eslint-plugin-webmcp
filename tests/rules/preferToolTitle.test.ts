import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('prefer-tool-title', rules['prefer-tool-title'], {
  valid: [
    registerTool('title: "搜索"'),
    registerTool('title: translate("search")'),
    registerTool('...unknown'),
  ],
  invalid: [
    { code: registerTool('name: "search"'), errors: [{ messageId: 'title' }] },
    { code: registerTool('title: " "'), errors: [{ messageId: 'title' }] },
    {
      code: registerTool('title: undefined'),
      errors: [{ messageId: 'title' }],
    },
  ],
})
