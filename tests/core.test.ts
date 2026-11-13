import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { rules } from '../src/rules'

const tester = new RuleTester({ languageOptions: { parser } })
const register = (properties: string) =>
  `document.modelContext.registerTool({ ${properties} })`
const complete = `name: 'search', description: 'Search products', execute() { return 'ok' }`

tester.run('require-tool-properties', rules['require-tool-properties'], {
  valid: [
    register(complete),
    register('...unknown'),
    register(`name: 'search', ...unknown`),
    register(`...unknown, name: 'search'`),
    register(`['na' + key]: 'search'`),
    register(`get name() { return 'search' }`),
    register(`__proto__: inherited`),
    register(`name: 'search', description: 'Search', execute: run`),
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
      code: register(''),
      errors: [
        { messageId: 'missing', data: { property: 'name' } },
        { messageId: 'missing', data: { property: 'description' } },
        { messageId: 'missing', data: { property: 'execute' } },
      ],
    },
    {
      code: register(`description: 'Search', execute() {}`),
      errors: [{ messageId: 'missing', data: { property: 'name' } }],
    },
    {
      code: register(`name: 'search', execute() {}`),
      errors: [{ messageId: 'missing', data: { property: 'description' } }],
    },
    {
      code: register(`name: 'search', description: 'Search'`),
      errors: [{ messageId: 'missing', data: { property: 'execute' } }],
    },
    {
      code: register(`${complete}, name: undefined`),
      errors: [{ messageId: 'missing', data: { property: 'name' } }],
    },
    {
      code: register(`${complete}, execute: undefined`),
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
      code: register(`...{ name: 'search' }, description: 'Search'`),
      errors: [{ messageId: 'missing', data: { property: 'execute' } }],
    },
    ...['null', 'undefined', 'false', '42', "'tool'"].map(argument => ({
      code: `document.modelContext.registerTool(${argument})`,
      errors: [{ messageId: 'invalid' as const }],
    })),
  ],
})

tester.run('valid-tool-name', rules['valid-tool-name'], {
  valid: [
    ...['a', 'A_Z-0.tool', '9', 'a'.repeat(128)].map(name =>
      register(`name: ${JSON.stringify(name)}`),
    ),
    register('name: dynamic'),
    register('name: 123'),
    register('name: `search`'),
    // oxlint-disable-next-line no-template-curly-in-string -- This is source text parsed by the rule tester.
    register('name: `search${id}`'),
    register(`name: 'bad name', ...unknown`),
    register(`name: 'bad name', name: 'good'`),
    register(`name: 'bad name', [key]: 'maybe'`),
    register(`get name() { return 'bad name' }`),
    'function f(window) { window.document.modelContext.registerTool({name: "bad name"}) }',
    'function f(globalThis) { globalThis.document.modelContext.registerTool({name: "bad name"}) }',
    'const context = document.modelContext; context.registerTool = custom; context.registerTool({name: "bad name"})',
    'const context = document.modelContext; const alias = context; alias.registerTool = custom; context.registerTool({name: "bad name"})',
    'const context = document.modelContext; const alias = context; mutate(alias); context.registerTool({name: "bad name"})',
    ...[
      '({ registerTool: context.registerTool } = custom)',
      '({ nested: { registerTool: context.registerTool } } = custom)',
      '[context.registerTool] = callbacks',
      '[...context.registerTool] = callbacks',
      '({ ...context.registerTool } = custom)',
      '({ registerTool: context.registerTool = fallback } = custom)',
      'for (context.registerTool of callbacks) {}',
      'for (context.registerTool in callbacks) {}',
      'for ({ registerTool: context.registerTool } of callbacks) {}',
      '(context.registerTool as unknown) = custom',
      'delete (context.registerTool!)',
    ].map(
      mutation =>
        `const context = document.modelContext; ${mutation}; context.registerTool({name: "bad name"})`,
    ),
    'const context = document.modelContext; const alias = context; ({ registerTool: alias.registerTool } = custom); context.registerTool({name: "bad name"})',
    ...[
      '(context!).registerTool = custom',
      'delete (context as ModelContext).registerTool',
      'mutate(context!)',
      'const alias = context!; mutate(alias)',
    ].map(
      mutation =>
        `const context = document.modelContext; ${mutation}; context!.registerTool({name: "bad name"})`,
    ),
    'let context = document.modelContext; context = other; context.registerTool({name: "bad name"})',
    'const name = "bad name"; function f() { document.modelContext.registerTool({name}) }',
  ],
  invalid: [
    ...[
      '',
      'a b',
      'a/b',
      '搜索',
      'tool\n',
      'tool\r',
      'tool\u2028',
      '😀',
      'a'.repeat(129),
    ].map(name => ({
      code: register(`name: ${JSON.stringify(name)}`),
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: register(`...unknown, name: 'bad name'`),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: register(`[key]: unknown, name: 'bad name'`),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: register(`name: 'good', ...{name: 'bad name'}`),
      errors: [{ messageId: 'invalid' }],
    },
    { code: register('name: `bad name`'), errors: [{ messageId: 'invalid' }] },
    {
      code: 'const name = "bad name"; document.modelContext.registerTool({name})',
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: "const context = document.modelContext; context.getTools(); context.registerTool({name: 'bad name'})",
      errors: [{ messageId: 'invalid' }],
    },
    ...[
      'context!',
      '(context as ModelContext)',
      '(context satisfies ModelContext)',
      '(<ModelContext>context)',
    ].map(receiver => ({
      code: `const context = document.modelContext; ${receiver}.registerTool({name: "bad name"})`,
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: 'const context = document.modelContext; const alias = context!; alias.registerTool({name: "bad name"})',
      errors: [{ messageId: 'invalid' }],
    },
    ...[
      'copy = context.registerTool',
      '({ [context.registerTool]: copy } = custom)',
      '({ registerTool: copy = context.registerTool } = custom)',
      'for (const callback of context.callbacks) {}',
    ].map(read => ({
      code: `const context = document.modelContext; ${read}; context.registerTool({name: "bad name"})`,
      errors: [{ messageId: 'invalid' as const }],
    })),
  ],
})

tester.run('valid-execute', rules['valid-execute'], {
  valid: [
    register('execute() { return "ok" }'),
    register('execute: () => ({ ok: true })'),
    register('execute: async () => "ok"'),
    register('execute: callback'),
    register('execute: callback.bind(receiver)'),
    register('execute: undefined'),
    register('get execute() { return callback }'),
    register('execute: false, ...unknown'),
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
    code: register(`execute: ${value}`),
    errors: [{ messageId: 'invalid' as const }],
  })),
})

tester.run('no-empty-description', rules['no-empty-description'], {
  valid: [
    register(`description: '搜索商品'`),
    register('description: description'),
    register('description: 42'),
    register(`description: '', ...unknown`),
  ],
  invalid: ['', ' ', '\t\n', '\u3000'].map(description => ({
    code: register(`description: ${JSON.stringify(description)}`),
    errors: [{ messageId: 'empty' as const }],
  })),
})

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
