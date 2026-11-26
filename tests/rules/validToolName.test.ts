import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('valid-tool-name', rules['valid-tool-name'], {
  valid: [
    ...['a', 'A_Z-0.tool', '9', 'a'.repeat(128)].map(name =>
      registerTool(`name: ${JSON.stringify(name)}`),
    ),
    registerTool('name: dynamic'),
    registerTool('name: 123'),
    registerTool('name: `search`'),
    // oxlint-disable-next-line no-template-curly-in-string -- This is source text parsed by the rule tester.
    registerTool('name: `search${id}`'),
    registerTool(`name: 'bad name', ...unknown`),
    registerTool(`name: 'bad name', name: 'good'`),
    registerTool(`name: 'bad name', [key]: 'maybe'`),
    registerTool(`get name() { return 'bad name' }`),
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
      code: registerTool(`name: ${JSON.stringify(name)}`),
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: registerTool(`...unknown, name: 'bad name'`),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: registerTool(`[key]: unknown, name: 'bad name'`),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: registerTool(`name: 'good', ...{name: 'bad name'}`),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: registerTool('name: `bad name`'),
      errors: [{ messageId: 'invalid' }],
    },
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
