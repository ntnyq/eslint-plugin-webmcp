import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()

tester.run('valid-registered-tool', rules['valid-registered-tool'], {
  valid: [
    'document.modelContext.executeTool(tool)',
    'document.modelContext.executeTool()',
    'document.modelContext.executeTool(...args)',
  ],
  invalid: [
    "'search'",
    'null',
    'false',
    'undefined',
    '42',
    '{}',
    '{...tool}',
  ].map(value => ({
    code: `document.modelContext.executeTool(${value})`,
    errors: [{ messageId: 'native' as const }],
  })),
})

for (const { target, requiresNativeTool } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
    `${target}: valid-registered-tool`,
    rules['valid-registered-tool'],
    {
      valid: [
        'document.modelContext.executeTool(tool)',
        'const context = document.modelContext; context.executeTool(tool)',
        'const tool = findTool(); document.modelContext.executeTool(tool)',
        'const tools = await document.modelContext.getTools(); document.modelContext.executeTool(tools[0])',
        'const [tool] = await document.modelContext.getTools(); document.modelContext.executeTool(tool)',
        'document.modelContext.executeTool(await findTool())',
        'import { tool } from "./tools"; document.modelContext.executeTool(tool)',
        'let tool = {}; tool = findTool(); document.modelContext.executeTool(tool)',
        'const tool = {}; consume(tool); document.modelContext.executeTool(tool)',
        'const tool = []; consume(tool); document.modelContext.executeTool(tool)',
        'const tool = []; tool.name = "search"; document.modelContext.executeTool(tool)',
        'const tool = {}; function f() { document.modelContext.executeTool(tool) }',
        'function f(document) { document.modelContext.executeTool({}) }',
        'function f(globalThis) { globalThis.document.modelContext.executeTool({}) }',
        'other.executeTool({})',
        'document.modelContext.executeTool()',
        'document.modelContext.executeTool(...args)',
        'const {executeTool} = document.modelContext; executeTool({})',
        'document.modelContext.executeTool.call(document.modelContext, {})',
        ...(requiresNativeTool
          ? []
          : [
              'document.modelContext.executeTool({...tool})',
              'document.modelContext.executeTool({__proto__: tool})',
              'document.modelContext.executeTool({name: "search", description: "Search", window, origin})',
            ]),
      ],
      invalid: [
        ...[
          'document.modelContext.executeTool([])',
          'document.modelContext.executeTool([unknown, ...items])',
          'const tool = []; document.modelContext.executeTool(tool satisfies object)',
        ].map(code => ({
          code,
          errors: requiresNativeTool
            ? [{ messageId: 'native' as const }]
            : ['name', 'description', 'window', 'origin'].map(property => ({
                messageId: 'missing' as const,
                data: { property },
              })),
        })),
        ...["'search'", 'null', 'undefined', '42', 'false', '1n'].map(
          value => ({
            code: `document.modelContext.executeTool(${value})`,
            errors: [
              {
                messageId: requiresNativeTool
                  ? ('native' as const)
                  : ('invalid' as const),
              },
            ],
          }),
        ),
        ...(requiresNativeTool
          ? [
              '{}',
              '{name: "search", description: "Search", window, origin}',
              '{...tool}',
              '{...tool, name: "search"}',
              '{__proto__: Tool.prototype}',
              '{get name() { return tool.name }}',
              '{[dynamic]: value}',
              '[tool]',
              '() => tool',
              'function() {}',
              'class {}',
              '/tool/',
            ].map(value => ({
              code: `document.modelContext.executeTool(${value})`,
              errors: [{ messageId: 'native' as const }],
            }))
          : [
              {
                code: 'document.modelContext.executeTool({})',
                errors: Array.from({ length: 4 }, () => ({
                  messageId: 'missing' as const,
                })),
              },
              {
                code: 'document.modelContext.executeTool({name: "search", description: "Search", origin})',
                errors: [
                  {
                    messageId: 'missing' as const,
                    data: { property: 'window' },
                  },
                ],
              },
              {
                code: 'document.modelContext.executeTool({name: "search", description: "Search", window, origin: undefined})',
                errors: [
                  {
                    messageId: 'missing' as const,
                    data: { property: 'origin' },
                  },
                ],
              },
            ]),
        ...(requiresNativeTool
          ? [
              'const tool = {...discovered}; document.modelContext.executeTool(tool)',
              'const context = document.modelContext; context["executeTool"]({})',
              'window.document.modelContext?.executeTool?.({} as Tool)',
              'globalThis.document.modelContext.executeTool({} satisfies Tool)',
              'const tool = {__proto__: Tool.prototype}; document.modelContext.executeTool(tool!)',
            ].map(code => ({
              code,
              errors: [{ messageId: 'native' as const }],
            }))
          : []),
      ],
    },
  )
}
