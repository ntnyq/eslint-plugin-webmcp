import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { rules } from '../src/rules'

const tester = new RuleTester({ languageOptions: { parser } })
const register = (schema: string) =>
  `document.modelContext.registerTool({inputSchema: ${schema}})`
const jsonOptions = [{ mode: 'json-schema', dialect: '2020-12' }] as const
const chrome = { webmcp: { target: 'chrome-2026-09-01' } }

for (const property of ['inputSchema', 'outputSchema'] as const) {
  const registerSchema = (schema: string) =>
    `document.modelContext.registerTool({${property}: ${schema}})`
  const ruleName =
    property === 'inputSchema' ? 'valid-input-schema' : 'valid-output-schema'
  tester.run(ruleName, rules[ruleName], {
    valid: [
      'document.modelContext.registerTool({name: "no-schema"})',
      { code: registerSchema('{enum: []}'), options: jsonOptions },
      registerSchema('undefined'),
      registerSchema('{}'),
      registerSchema('[]'),
      registerSchema('schema'),
      registerSchema('{properties: {query: dynamic}}'),
      registerSchema('makeSchema()'),
      `document.modelContext.registerTool({${property}: null, ${property}: {}})`,
      `function f(document) { ${registerSchema('null')} }`,
      `function f(window) { window.document.modelContext.registerTool({${property}: null}) }`,
      `other.registerTool({${property}: null})`,
      `const { registerTool } = document.modelContext; registerTool({${property}: null})`,
      `document.modelContext.executeTool({${property}: null})`,
      `document.modelContext.registerTool({${property}: null, ...unknown})`,
      `const schema = {}; schema.self = schema; ${registerSchema('schema')}`,
      `const schema = {}; consume(schema); ${registerSchema('schema')}`,
      `let schema = null; schema = dynamic; ${registerSchema('schema')}`,
      `document.modelContext.registerTool({[dynamic]: null})`,
      registerSchema('{type: "made-up"}'),
      registerSchema('{get type() { return "object" }}'),
      registerSchema('{toJSON() { return {} }, value: 1n}'),
      registerSchema('{...unknown, type: "object"}'),
      {
        code: registerSchema('{type: "object", required: ["notInProperties"]}'),
        options: jsonOptions,
      },
      {
        code: registerSchema('{type: "object", additionalProperties: true}'),
        options: jsonOptions,
      },
      {
        code: registerSchema('{$ref: "https://example.com/schema.json"}'),
        options: jsonOptions,
      },
      {
        code: registerSchema(
          '{$defs: {query: {type: "string"}}, properties: {query: {$ref: "#/$defs/query"}}}',
        ),
        options: jsonOptions,
      },
      {
        code: registerSchema(
          '{type: "object", properties: {anything: true, forbidden: false}}',
        ),
        options: jsonOptions,
      },
      {
        code: registerSchema(
          '{$schema: "https://json-schema.org/draft/2019-09/schema", type: "unknown"}',
        ),
        options: jsonOptions,
      },
      {
        code: registerSchema(
          '{type: "string", format: "custom-format", custom: true}',
        ),
        options: jsonOptions,
      },
      {
        code: registerSchema('{description: undefined, type: "object"}'),
        options: jsonOptions,
      },
    ],
    invalid: [
      ...['null', 'false', '42', "'{}'", '1n'].map(schema => ({
        code: registerSchema(schema),
        errors: [{ messageId: 'object' as const }],
      })),
      {
        code: `const schema = null; const tool = {${property}: schema}; const context = document.modelContext; context['registerTool'](tool satisfies object)`,
        errors: [{ messageId: 'object' }],
      },
      {
        code: `const schema = {type: 'object', required: 'query'}; ${registerSchema('schema as const')}`,
        options: jsonOptions,
        errors: [{ messageId: 'schema' }],
      },
      {
        code: `document.modelContext.registerTool({ ...unknown, ${property}: null })`,
        errors: [{ messageId: 'object' }],
      },
      {
        code: `document.modelContext.registerTool({ ${property}: {}, ${property}: null })`,
        errors: [{ messageId: 'object' }],
      },
      {
        code: `document.modelContext?.registerTool?.({ ['${property}']: null } satisfies object)`,
        errors: [{ messageId: 'object' }],
      },
      {
        code: `import { defineTool as define } from '@app/webmcp'; define({${property}: null})`,
        settings: {
          webmcp: {
            wrappers: [
              {
                module: '@app/webmcp',
                imported: 'defineTool',
                toolArgument: 0,
                kind: 'definition',
              },
            ],
          },
        },
        errors: [{ messageId: 'object' }],
      },
      {
        code: registerSchema('{properties: {limit: {const: 1n}}}'),
        errors: [{ messageId: 'serialization' }],
      },
      ...[
        '{type: "made-up"}',
        '{required: "query"}',
        '{required: ["query", "query"]}',
        '{properties: []}',
        '{minLength: -1}',
        '[]',
      ].map(schema => ({
        code: registerSchema(schema),
        options: jsonOptions,
        errors: [{ messageId: 'schema' as const }],
      })),
    ],
  })
}

tester.run(
  'no-incompatible-execute-arguments',
  rules['no-incompatible-execute-arguments'],
  {
    valid: [
      'document.modelContext.executeTool(tool)',
      'document.modelContext.executeTool(tool, undefined)',
      'document.modelContext.executeTool(tool, {})',
      'document.modelContext.executeTool(tool, dynamic)',
      'document.modelContext.executeTool(...args, "{}")',
      {
        code: 'document.modelContext.executeTool(tool, "{}")',
        settings: chrome,
      },
      {
        code: 'document.modelContext.executeTool(tool, JSON.stringify({query: "text"}))',
        settings: chrome,
      },
    ],
    invalid: [
      ...['"{}"', 'false', 'null', '42'].map(input => ({
        code: `document.modelContext.executeTool(tool, ${input})`,
        errors: [{ messageId: 'object' as const }],
      })),
      {
        code: 'document.modelContext.executeTool(tool, {})',
        settings: chrome,
        errors: [{ messageId: 'text' }],
      },
      {
        code: 'document.modelContext.executeTool(tool, [])',
        settings: chrome,
        errors: [{ messageId: 'text' }],
      },
    ],
  },
)

tester.run(
  'prefer-parameter-descriptions',
  rules['prefer-parameter-descriptions'],
  {
    valid: [
      register('{properties: {query: {description: "搜索关键词"}}}'),
      register('{properties: {query: {description: translate("query")}}}'),
      register('{properties: {query: {$ref: "#/$defs/query"}}}'),
      register(
        '{$defs: {query: {$dynamicAnchor: "query", type: "string", description: "Search query"}}, properties: {query: {$dynamicRef: "#query"}}}',
      ),
      register(
        '{properties: {query: {$dynamicRef: "https://example.com/query"}}}',
      ),
      register('{properties: {query: {...unknown}}}'),
      register('{properties: {anything: true, forbidden: false}}'),
      register(
        '{default: {properties: {query: {}}}, examples: [{properties: {query: {}}}]}',
      ),
    ],
    invalid: [
      {
        code: register('{properties: {query: {type: "string"}}}'),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: register('{properties: {query: {description: " "}}}'),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: register('{allOf: [{properties: {query: {}}}]}'),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: register(
          '{properties: {parent: {description: "Parent", properties: {child: {}}}}}',
        ),
        errors: [{ messageId: 'missing' }],
      },
    ],
  },
)

const serializedSchemas = [
  '{properties: {query: {}}, toJSON() { return {properties: {query: {description: "Query"}}} }}',
  '{properties: {query: {description: "A long description"}}, toJSON: serialize}',
  '{allOf: [{properties: {query: {}}, toJSON: serialize}]}',
  '{properties: {query: {toJSON() { return {description: "Query"} }}}}',
  '{properties: {query: {description: "A long description", toJSON: serialize}}}',
  '{properties: {query: {properties: {nested: {}}}, toJSON: serialize}}',
  '{properties: {query: {description: "A long description"}, toJSON: serialize}}',
  '{...unknown, properties: {query: {description: "A long description"}}}',
  '{properties: {...unknown, query: {description: "A long description"}}}',
  '{properties: {query: {...unknown, description: "A long description"}}}',
]

tester.run(
  'prefer-parameter-descriptions serialization',
  rules['prefer-parameter-descriptions'],
  {
    valid: [
      ...serializedSchemas.map(schema => register(schema)),
      'const schema = {properties: {query: {}}, toJSON: serialize}; document.modelContext.registerTool({inputSchema: schema})',
      'const query = {toJSON: serialize}; document.modelContext.registerTool({inputSchema: {properties: {query}}})',
    ],
    invalid: [
      {
        code: register('{properties: {query: {toJSON: serialize}, other: {}}}'),
        errors: [{ messageId: 'missing', data: { name: 'other' } }],
      },
      {
        code: register('{properties: {toJSON: {type: "string"}}}'),
        errors: [{ messageId: 'missing', data: { name: 'toJSON' } }],
      },
      {
        code: register(
          '{...unknown, toJSON: undefined, properties: {query: {}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'query' } }],
      },
      {
        code: register(
          '{properties: {query: {$dynamicRef: "#query"}, other: {}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'other' } }],
      },
    ],
  },
)

tester.run(
  'max-description-length serialization',
  rules['max-description-length'],
  {
    valid: serializedSchemas.map(schema => ({
      code: register(schema),
      options: [{ parameter: 3 }],
    })),
    invalid: [
      {
        code: register(
          '{properties: {query: {description: "Ignored", toJSON: serialize}, other: {description: "Long"}}}',
        ),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
      {
        code: register('{properties: {toJSON: {description: "Long"}}}'),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
      {
        code: register(
          '{properties: {query: {$dynamicRef: "#query", description: "Long"}}}',
        ),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
    ],
  },
)
