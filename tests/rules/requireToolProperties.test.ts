import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()
const complete = `name: 'search', description: 'Search products', execute() { return 'ok' }`

tester.run('require-tool-properties', rules['require-tool-properties'], {
  valid: [
    registerTool(complete),
    registerTool('...unknown'),
    registerTool(`name: 'search', ...unknown`),
    registerTool(`...unknown, name: 'search'`),
    registerTool(`['na' + key]: 'search'`),
    registerTool(`get name() { return 'search' }`),
    registerTool(`__proto__: inherited`),
    registerTool(`name: 'search', description: 'Search', execute: run`),
    'document.modelContext.registerTool(...args)',
    'document.modelContext.registerTool()',
    'function f(document) { document.modelContext.registerTool({}) }',
    'const document = custom; document.modelContext.registerTool({})',
    'server.registerTool({})',
    'navigator.modelContext.registerTool({})',
    'const tool = {}; tool.name = "search"; document.modelContext.registerTool(tool)',
    'const tool = []; tool.name = "search"; document.modelContext.registerTool(tool)',
    'const tool = []; consume(tool); document.modelContext.registerTool(tool)',
    'const tool = []; function f() { document.modelContext.registerTool(tool) }',
    'const tool = {}; mutate(tool); document.modelContext.registerTool(tool)',
    'const tool = {}; const alias = tool; mutate(alias); document.modelContext.registerTool(tool)',
    'const tool = {}; export { tool }; document.modelContext.registerTool(tool)',
    'export const tool = {}; document.modelContext.registerTool(tool)',
    'const tool = {}; function f() { document.modelContext.registerTool(tool) }',
    'const tool = {}; function f() { tool.name = "search" } document.modelContext.registerTool(tool)',
    `const tool = { ${complete} }; document.modelContext.registerTool(tool)`,
    `const tool = { ${complete} }; const alias = tool; document.modelContext.registerTool(alias)`,
    `const { registerTool } = document.modelContext; registerTool({})`,
  ],
  invalid: [
    ...[
      'document.modelContext.registerTool([])',
      'document.modelContext.registerTool([unknown, ...items])',
      'const tool = []; document.modelContext.registerTool(tool as object)',
    ].map(code => ({
      code,
      errors: ['name', 'description', 'execute'].map(property => ({
        messageId: 'missing' as const,
        data: { property },
      })),
    })),
    {
      code: registerTool(''),
      errors: [
        { messageId: 'missing', data: { property: 'name' } },
        { messageId: 'missing', data: { property: 'description' } },
        { messageId: 'missing', data: { property: 'execute' } },
      ],
    },
    {
      code: registerTool(`description: 'Search', execute() {}`),
      errors: [{ messageId: 'missing', data: { property: 'name' } }],
    },
    {
      code: registerTool(`name: 'search', execute() {}`),
      errors: [{ messageId: 'missing', data: { property: 'description' } }],
    },
    {
      code: registerTool(`name: 'search', description: 'Search'`),
      errors: [{ messageId: 'missing', data: { property: 'execute' } }],
    },
    {
      code: registerTool(`${complete}, name: undefined`),
      errors: [{ messageId: 'missing', data: { property: 'name' } }],
    },
    {
      code: registerTool(`${complete}, execute: undefined`),
      errors: [{ messageId: 'missing', data: { property: 'execute' } }],
    },
    {
      code: 'const tool = {}; document.modelContext.registerTool(tool)',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: 'const context = document.modelContext; context.registerTool({})',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: 'const context = document.modelContext; const alias = context; alias.registerTool({})',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: 'window.document.modelContext.registerTool({})',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: "globalThis.document['modelContext']['registerTool']({})",
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: 'document?.modelContext?.registerTool?.({} as const)',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: '(document!.modelContext).registerTool({} satisfies object)',
      errors: Array.from({ length: 3 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: registerTool(`...{ name: 'search' }, description: 'Search'`),
      errors: [{ messageId: 'missing', data: { property: 'execute' } }],
    },
    ...['null', 'undefined', 'false', '42', "'tool'"].map(argument => ({
      code: `document.modelContext.registerTool(${argument})`,
      errors: [{ messageId: 'invalid' as const }],
    })),
  ],
})
