import { rules } from '../../src/rules'
import { createRuleTester, registerToolWithOptions } from '../helpers'

const tester = createRuleTester()

tester.run('valid-origin-list', rules['valid-origin-list'], {
  valid: [
    registerToolWithOptions('exposedTo: []'),
    registerToolWithOptions(
      "exposedTo: ['https://agent.example', 'http://localhost', 'http://127.0.0.1', 'http://[::1]']",
    ),
    registerToolWithOptions('exposedTo: new Set(origins)'),
    registerToolWithOptions('exposedTo: origins'),
    registerToolWithOptions('exposedTo: undefined'),
    registerToolWithOptions('exposedTo: [dynamic]'),
    registerToolWithOptions(
      'exposedTo: [{toString() { return "https://agent.example" }}]',
    ),
    'function f(undefined) { document.modelContext.getTools({fromOrigins: [undefined]}) }',
    registerToolWithOptions('exposedTo: { [Symbol.iterator]: iterator }'),
    registerToolWithOptions('exposedTo: { __proto__: iterable }'),
    registerToolWithOptions('exposedTo: { [dynamic]: iterator }'),
    'document.modelContext.getTools({fromOrigins: ["https://agent.example"]})',
  ],
  invalid: [
    ...['false', 'null', '42', "'https://agent.example'", '{}'].map(
      origins => ({
        code: registerToolWithOptions(`exposedTo: ${origins}`),
        errors: [{ messageId: 'list' as const }],
      }),
    ),
    {
      code: registerToolWithOptions("exposedTo: ['*', '/agent']"),
      errors: [{ messageId: 'url' }, { messageId: 'url' }],
    },
    {
      code: 'document.modelContext.getTools({fromOrigins: [dynamic, "bad", ...others]})',
      errors: [{ messageId: 'url' }],
    },
    ...['null', 'undefined', 'false', '42', '1n', 'void 0'].map(origin => ({
      code: registerToolWithOptions(`exposedTo: [${origin}]`),
      errors: [{ messageId: 'url' as const }],
    })),
    {
      code: registerToolWithOptions('exposedTo: [, ...others, null]'),
      errors: [
        { messageId: 'url', data: { origin: 'undefined' } },
        { messageId: 'url', data: { origin: 'null' } },
      ],
    },
  ],
})
