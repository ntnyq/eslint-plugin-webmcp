import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { rules } from '../src/rules'

const tester = new RuleTester({ languageOptions: { parser } })
const register = (properties: string) =>
  `document.modelContext.registerTool({ ${properties} })`

tester.run('no-unknown-tool-properties', rules['no-unknown-tool-properties'], {
  valid: [
    register('name, description, title, execute, inputSchema, annotations'),
    register('...unknown'),
    {
      code: register('custom: true'),
      options: [{ allowProperties: ['custom'] }],
    },
  ],
  invalid: [
    { code: register('input_schema: {}'), errors: [{ messageId: 'unknown' }] },
    {
      code: register('signal: controller.signal'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: register('...unknown, input_schema: {}'),
      errors: [{ messageId: 'unknown' }],
    },
  ],
})

tester.run('valid-annotations', rules['valid-annotations'], {
  valid: [
    register(
      'annotations: {readOnlyHint: true, untrustedContentHint: false, consequentialHint: false}',
    ),
    register('annotations: {readOnlyHint: dynamic}'),
    register('annotations: {...unknown}'),
    register('annotations: undefined'),
    register('annotations: null'),
    register('annotations: {readOnlyHint: undefined}'),
  ],
  invalid: [
    {
      code: register('annotations: {destructiveHint: true}'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: register('annotations: {readOnlyHint: "false"}'),
      errors: [{ messageId: 'boolean' }],
    },
    {
      code: register('annotations: {readOnlyHint: 0}'),
      errors: [{ messageId: 'boolean' }],
    },
    {
      code: register('annotations: "readonly"'),
      errors: [{ messageId: 'dictionary' }],
    },
  ],
})

tester.run('prefer-tool-title', rules['prefer-tool-title'], {
  valid: [
    register('title: "搜索"'),
    register('title: translate("search")'),
    register('...unknown'),
  ],
  invalid: [
    { code: register('name: "search"'), errors: [{ messageId: 'title' }] },
    { code: register('title: " "'), errors: [{ messageId: 'title' }] },
    { code: register('title: undefined'), errors: [{ messageId: 'title' }] },
  ],
})

tester.run('no-placeholder-description', rules['no-placeholder-description'], {
  valid: [
    register('description: "List TODO comments in the project"'),
    register('description: ""'),
    register('description: translate("search")'),
    {
      code: register('description: "TODO"'),
      options: [{ placeholders: ['WIP'] }],
    },
  ],
  invalid: [
    ...['TODO', 'TBD', 'FIXME', ' todo '].map(description => ({
      code: register(`description: ${JSON.stringify(description)}`),
      errors: [{ messageId: 'placeholder' as const }],
    })),
    {
      code: register('description: "待完善"'),
      options: [{ placeholders: ['待完善'] }],
      errors: [{ messageId: 'placeholder' }],
    },
  ],
})

tester.run('max-description-length', rules['max-description-length'], {
  valid: [
    register(`description: ${JSON.stringify('a'.repeat(500))}`),
    { code: register('description: "😀😀"'), options: [{ tool: 2 }] },
    { code: register('description: dynamic'), options: [{ tool: 1 }] },
  ],
  invalid: [
    {
      code: register(`description: ${JSON.stringify('a'.repeat(501))}`),
      errors: [{ messageId: 'long' }],
    },
    {
      code: register('description: "😀😀😀"'),
      options: [{ tool: 2 }],
      errors: [{ messageId: 'long', data: { length: 3, limit: 2 } }],
    },
    {
      code: register(
        'inputSchema: {properties: {query: {description: "Search query"}}}',
      ),
      options: [{ parameter: 3 }],
      errors: [{ messageId: 'long' }],
    },
  ],
})

tester.run('tool-name-convention', rules['tool-name-convention'], {
  valid: [
    register('name: "search_products"'),
    register('name: "invalid name"'),
    {
      code: register('name: "search-products"'),
      options: [{ style: 'kebab-case' }],
    },
    {
      code: register('name: "searchProducts"'),
      options: [{ style: 'camelCase' }],
    },
    {
      code: register('name: "catalog.search-products"'),
      options: [
        {
          style: 'dot-separated',
          segmentStyle: 'kebab-case',
          prefix: 'catalog.',
        },
      ],
    },
    {
      code: register('name: "catalog.search_products"'),
      options: [{ style: 'dot-separated', segmentStyle: 'snake_case' }],
    },
  ],
  invalid: [
    {
      code: register('name: "SearchProducts"'),
      errors: [{ messageId: 'convention' }],
    },
    {
      code: register('name: "search-products"'),
      errors: [{ messageId: 'convention' }],
    },
    {
      code: register('name: "other.search"'),
      options: [{ style: 'dot-separated', prefix: 'catalog.' }],
      errors: [{ messageId: 'convention' }],
    },
    {
      code: register('name: "catalog..search"'),
      options: [{ style: 'dot-separated' }],
      errors: [{ messageId: 'convention' }],
    },
  ],
})

tester.run(
  'require-explicit-annotations',
  rules['require-explicit-annotations'],
  {
    valid: [
      register('annotations: {readOnlyHint: true, consequentialHint: false}'),
      register(
        'annotations: {readOnlyHint: dynamic, consequentialHint: evaluate()}',
      ),
      register('annotations: {...unknown}'),
      register('...unknown'),
      {
        code: register('annotations: {untrustedContentHint: false}'),
        options: [{ fields: ['untrustedContentHint'] }],
      },
    ],
    invalid: [
      {
        code: register(''),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: register('annotations: {}'),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: register('annotations: null'),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: register('annotations: {readOnlyHint: true}'),
        errors: [{ messageId: 'missing', data: { name: 'consequentialHint' } }],
      },
      {
        code: register(
          'annotations: {readOnlyHint: true, consequentialHint: undefined}',
        ),
        errors: [{ messageId: 'missing' }],
      },
    ],
  },
)
