import { rules } from '../../src/rules'
import { createRuleTester, registerToolWithOptions } from '../helpers'

const tester = createRuleTester()

tester.run('prefer-canonical-origin', rules['prefer-canonical-origin'], {
  valid: [
    registerToolWithOptions(
      "exposedTo: ['https://agent.example', 'https://agent.example/', 'invalid']",
    ),
    registerToolWithOptions('exposedTo: [dynamic]'),
    registerToolWithOptions("exposedTo: ['http://localhost:3000/']"),
  ],
  invalid: [
    ...[
      'https://agent.example/private',
      'https://agent.example/?team=alpha',
      'https://agent.example/#fragment',
      'https://user:pass@agent.example',
    ].map(origin => ({
      code: registerToolWithOptions(`exposedTo: [${JSON.stringify(origin)}]`),
      errors: [{ messageId: 'canonical' as const }],
    })),
    {
      code: 'document.modelContext.getTools({fromOrigins: ["https://agent.example/private"]})',
      errors: [{ messageId: 'canonical' }],
    },
  ],
})
