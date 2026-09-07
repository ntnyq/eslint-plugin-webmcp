import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { rules } from '../src/rules'

const tester = new RuleTester({ languageOptions: { parser } })
const chrome = { webmcp: { target: 'chrome-2026-09-01' } }
const register = (options: string) =>
  `document.modelContext.registerTool(tool, { ${options} })`

tester.run('require-api-arguments', rules['require-api-arguments'], {
  valid: [
    'document.modelContext.getTools()',
    'document.modelContext.executeTool(tool)',
    'document.modelContext.registerTool(undefined)',
    'document.modelContext.registerTool(...args)',
    { code: 'document.modelContext.executeTool(...args)', settings: chrome },
    { code: "document.modelContext.executeTool(tool, '{}')", settings: chrome },
  ],
  invalid: [
    {
      code: 'document.modelContext.registerTool()',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'document.modelContext.executeTool()',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'document.modelContext.executeTool(tool)',
      settings: chrome,
      errors: [{ messageId: 'input' }],
    },
  ],
})

tester.run('no-unknown-api-options', rules['no-unknown-api-options'], {
  valid: [
    register('signal: controller.signal, exposedTo: []'),
    'document.modelContext.getTools({fromOrigins: []})',
    'document.modelContext.executeTool(tool, {}, {signal})',
    register('...options'),
    { code: register('custom: true'), options: [{ allowOptions: ['custom'] }] },
    'document.modelContext.registerTool(...args, {invalid: true})',
  ],
  invalid: [
    {
      code: register('abortSignal: controller.signal'),
      errors: [{ messageId: 'unknown' }],
    },
    { code: register('fromOrigins: []'), errors: [{ messageId: 'unknown' }] },
    {
      code: 'document.modelContext.getTools({exposedTo: []})',
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: 'document.modelContext.executeTool(tool, {}, {exposedTo: []})',
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: register('...options, signall: signal'),
      errors: [{ messageId: 'unknown' }],
    },
  ],
})

tester.run('valid-abort-signal', rules['valid-abort-signal'], {
  valid: [
    register('signal: controller.signal'),
    register('signal: undefined'),
    register('signal: customSignal()'),
    register('signal: AbortSignal.timeout(1000)'),
    register('signal: new CustomSignal()'),
    'function f(AbortController) { document.modelContext.registerTool(tool, {signal: new AbortController()}) }',
    'document.modelContext.executeTool(tool, {}, {signal: controller.signal})',
    register('signal: false, ...unknown'),
  ],
  invalid: [
    ...[
      'false',
      'null',
      '42',
      "'signal'",
      '{}',
      '[]',
      'new AbortController()',
      '() => controller.signal',
    ].map(signal => ({
      code: register(`signal: ${signal}`),
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: 'document.modelContext.executeTool(tool, {}, {signal: false})',
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: 'const controller = new AbortController(); document.modelContext.registerTool(tool, {signal: controller})',
      errors: [{ messageId: 'invalid' }],
    },
  ],
})

tester.run('valid-origin-list', rules['valid-origin-list'], {
  valid: [
    register('exposedTo: []'),
    register(
      "exposedTo: ['https://agent.example', 'http://localhost', 'http://127.0.0.1', 'http://[::1]']",
    ),
    register('exposedTo: new Set(origins)'),
    register('exposedTo: origins'),
    register('exposedTo: undefined'),
    register('exposedTo: [dynamic]'),
    register('exposedTo: { [Symbol.iterator]: iterator }'),
    'document.modelContext.getTools({fromOrigins: ["https://agent.example"]})',
  ],
  invalid: [
    ...['false', 'null', '42', "'https://agent.example'"].map(origins => ({
      code: register(`exposedTo: ${origins}`),
      errors: [{ messageId: 'list' as const }],
    })),
    {
      code: register("exposedTo: ['*', '/agent']"),
      errors: [{ messageId: 'url' }, { messageId: 'url' }],
    },
    {
      code: 'document.modelContext.getTools({fromOrigins: [dynamic, "bad", ...others]})',
      errors: [{ messageId: 'url' }],
    },
  ],
})

tester.run('prefer-canonical-origin', rules['prefer-canonical-origin'], {
  valid: [
    register(
      "exposedTo: ['https://agent.example', 'https://agent.example/', 'invalid']",
    ),
    register('exposedTo: [dynamic]'),
    register("exposedTo: ['http://localhost:3000/']"),
  ],
  invalid: [
    ...[
      'https://agent.example/private',
      'https://agent.example/?team=alpha',
      'https://agent.example/#fragment',
      'https://user:pass@agent.example',
    ].map(origin => ({
      code: register(`exposedTo: [${JSON.stringify(origin)}]`),
      errors: [{ messageId: 'canonical' as const }],
    })),
    {
      code: 'document.modelContext.getTools({fromOrigins: ["https://agent.example/private"]})',
      errors: [{ messageId: 'canonical' }],
    },
  ],
})

tester.run(
  'no-preaborted-registration-signal',
  rules['no-preaborted-registration-signal'],
  {
    valid: [
      register('signal: controller.signal'),
      register('signal: AbortSignal.timeout(1)'),
      'if (condition) controller.abort(); document.modelContext.registerTool(tool, {signal: controller.signal})',
      'document.modelContext.executeTool(tool, {}, {signal: AbortSignal.abort()})',
      'function f(AbortSignal) { document.modelContext.registerTool(tool, {signal: AbortSignal.abort()}) }',
    ],
    invalid: [
      {
        code: register('signal: AbortSignal.abort()'),
        errors: [{ messageId: 'aborted' }],
      },
      {
        code: 'const signal = AbortSignal.abort(); document.modelContext.registerTool(tool, {signal})',
        errors: [{ messageId: 'aborted' }],
      },
    ],
  },
)

tester.run('valid-registered-tool', rules['valid-registered-tool'], {
  valid: [
    'document.modelContext.executeTool(tool)',
    'document.modelContext.executeTool({...tool})',
    'document.modelContext.executeTool({__proto__: tool})',
    'document.modelContext.executeTool({name: "search", description: "Search", window, origin})',
    'document.modelContext.executeTool()',
    'document.modelContext.executeTool(...args)',
  ],
  invalid: [
    ...["'search'", 'null', 'false', 'undefined', '42'].map(value => ({
      code: `document.modelContext.executeTool(${value})`,
      errors: [{ messageId: 'invalid' as const }],
    })),
    {
      code: 'document.modelContext.executeTool({})',
      errors: Array.from({ length: 4 }, () => ({
        messageId: 'missing' as const,
      })),
    },
    {
      code: 'document.modelContext.executeTool({name: "search", description: "Search", origin})',
      errors: [{ messageId: 'missing', data: { property: 'window' } }],
    },
    {
      code: 'document.modelContext.executeTool({name: "search", description: "Search", window, origin: undefined})',
      errors: [{ messageId: 'missing', data: { property: 'origin' } }],
    },
  ],
})

tester.run(
  'no-unknown-model-context-events',
  rules['no-unknown-model-context-events'],
  {
    valid: [
      'document.modelContext.addEventListener("toolchange", refresh)',
      'window.addEventListener("toolschange", refresh)',
      'document.modelContext.addEventListener(event, refresh)',
      {
        code: 'document.modelContext.addEventListener("custom", refresh)',
        options: [{ allowEvents: ['custom'] }],
      },
    ],
    invalid: [
      {
        code: 'document.modelContext.addEventListener("toolschange", refresh)',
        errors: [{ messageId: 'unknown' }],
      },
      {
        code: 'document.modelContext.removeEventListener("toolcancel", refresh)',
        errors: [{ messageId: 'unknown' }],
      },
    ],
  },
)
