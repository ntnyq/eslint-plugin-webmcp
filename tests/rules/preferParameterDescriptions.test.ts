import { rules } from '../../src/rules'
import { serializedSchemas } from '../fixtures/schemas'
import { createRuleTester, registerToolWithInputSchema } from '../helpers'

const tester = createRuleTester()

tester.run(
  'prefer-parameter-descriptions',
  rules['prefer-parameter-descriptions'],
  {
    valid: [
      registerToolWithInputSchema(
        '{properties: {query: {description: "搜索关键词"}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {description: translate("query")}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {$ref: dynamicReference}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {$dynamicRef: dynamicReference}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {$ref: undefined, description: "Query"}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {$ref: undefined, $dynamicRef: "#query"}}}',
      ),
      'function f(undefined) { document.modelContext.registerTool({inputSchema: {properties: {query: {description: undefined}}}}) }',
      registerToolWithInputSchema(
        '{properties: {query: {$ref: "#/$defs/query"}}}',
      ),
      registerToolWithInputSchema(
        '{$defs: {query: {$dynamicAnchor: "query", type: "string", description: "Search query"}}, properties: {query: {$dynamicRef: "#query"}}}',
      ),
      registerToolWithInputSchema(
        '{properties: {query: {$dynamicRef: "https://example.com/query"}}}',
      ),
      registerToolWithInputSchema('{properties: {query: {...unknown}}}'),
      registerToolWithInputSchema(
        '{properties: {anything: true, forbidden: false}}',
      ),
      registerToolWithInputSchema(
        '{default: {properties: {query: {}}}, examples: [{properties: {query: {}}}]}',
      ),
    ],
    invalid: [
      ...[
        '{description: undefined}',
        '{description: void 0}',
        '{$ref: undefined}',
        '{$dynamicRef: undefined}',
        '{$ref: undefined, $dynamicRef: undefined, description: undefined}',
      ].map(parameter => ({
        code: registerToolWithInputSchema(
          `{properties: {query: ${parameter}}}`,
        ),
        errors: [{ messageId: 'missing' as const, data: { name: 'query' } }],
      })),
      ...['description', '$ref', '$dynamicRef'].map(property => ({
        code: `const omitted = undefined; document.modelContext.registerTool({inputSchema: {properties: {query: {${property}: omitted}}}})`,
        errors: [{ messageId: 'missing' as const, data: { name: 'query' } }],
      })),
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {type: "string"}}}',
        ),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {description: " "}}}',
        ),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: registerToolWithInputSchema(
          '{allOf: [{properties: {query: {}}}]}',
        ),
        errors: [{ messageId: 'missing' }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {parent: {description: "Parent", properties: {child: {}}}}}',
        ),
        errors: [{ messageId: 'missing' }],
      },
    ],
  },
)

tester.run(
  'prefer-parameter-descriptions serialization',
  rules['prefer-parameter-descriptions'],
  {
    valid: [
      ...serializedSchemas.map(schema => registerToolWithInputSchema(schema)),
      'const schema = {properties: {query: {}}, toJSON: serialize}; document.modelContext.registerTool({inputSchema: schema})',
      'const query = {toJSON: serialize}; document.modelContext.registerTool({inputSchema: {properties: {query}}})',
    ],
    invalid: [
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {toJSON: serialize}, other: {}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'other' } }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {toJSON: {type: "string"}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'toJSON' } }],
      },
      {
        code: registerToolWithInputSchema(
          '{...unknown, toJSON: undefined, properties: {query: {}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'query' } }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {$dynamicRef: "#query"}, other: {}}}',
        ),
        errors: [{ messageId: 'missing', data: { name: 'other' } }],
      },
    ],
  },
)
