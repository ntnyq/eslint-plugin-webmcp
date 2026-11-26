import type { RunTests } from '@typescript-eslint/rule-tester'
import type { SchemaOptions } from '../../src/types'

const jsonOptions = [{ mode: 'json-schema', dialect: '2020-12' }] as const

export function schemaCases(
  property: 'inputSchema' | 'outputSchema',
): RunTests<'object' | 'serialization' | 'schema', SchemaOptions> {
  const registerSchema = (schema: string) =>
    `document.modelContext.registerTool({${property}: ${schema}})`

  return {
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
      {
        code: registerSchema('{$schema: undefined, type: "object"}'),
        options: jsonOptions,
      },
      {
        code: registerSchema('{$schema: unknownDialect, type: "made-up"}'),
        options: jsonOptions,
      },
      {
        code: registerSchema(
          '{$schema: "urn:example:dialect", type: "made-up"}',
        ),
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
        ...['null', '42', 'false', '[]', '{}'].map(
          dialect => `{$schema: ${dialect}, type: "made-up"}`,
        ),
        '{$schema: undefined, type: "made-up"}',
        '{$schema: "https://json-schema.org/draft/2020-12/schema#", type: "made-up"}',
        '[]',
      ].map(schema => ({
        code: registerSchema(schema),
        options: jsonOptions,
        errors: [{ messageId: 'schema' as const }],
      })),
    ],
  }
}

export const serializedSchemas = [
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
