import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('valid-execute', rules['valid-execute'], {
  valid: [
    registerTool('execute() { return "ok" }'),
    registerTool('execute: () => ({ ok: true })'),
    registerTool('execute: async () => "ok"'),
    registerTool('execute: callback'),
    registerTool('execute: callback.bind(receiver)'),
    registerTool('execute: undefined'),
    registerTool('get execute() { return callback }'),
    registerTool('execute: false, ...unknown'),
  ],
  invalid: [
    'null',
    'false',
    '123',
    "'execute'",
    '{}',
    '[]',
    '/pattern/',
    'class {}',
  ].map(value => ({
    code: registerTool(`execute: ${value}`),
    errors: [{ messageId: 'invalid' as const }],
  })),
})
