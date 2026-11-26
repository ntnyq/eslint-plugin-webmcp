import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('no-placeholder-description', rules['no-placeholder-description'], {
  valid: [
    registerTool('description: "List TODO comments in the project"'),
    registerTool('description: ""'),
    registerTool('description: translate("search")'),
    {
      code: registerTool('description: "TODO"'),
      options: [{ placeholders: ['WIP'] }],
    },
  ],
  invalid: [
    ...['TODO', 'TBD', 'FIXME', ' todo '].map(description => ({
      code: registerTool(`description: ${JSON.stringify(description)}`),
      errors: [{ messageId: 'placeholder' as const }],
    })),
    {
      code: registerTool('description: "待完善"'),
      options: [{ placeholders: ['待完善'] }],
      errors: [{ messageId: 'placeholder' }],
    },
  ],
})
