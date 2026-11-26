import { rules } from '../../src/rules'
import { serializedSchemas } from '../fixtures/schemas'
import {
  createRuleTester,
  registerTool,
  registerToolWithInputSchema,
} from '../helpers'

const tester = createRuleTester()

tester.run('max-description-length', rules['max-description-length'], {
  valid: [
    registerTool(`description: ${JSON.stringify('a'.repeat(500))}`),
    { code: registerTool('description: "😀😀"'), options: [{ tool: 2 }] },
    { code: registerTool('description: dynamic'), options: [{ tool: 1 }] },
  ],
  invalid: [
    {
      code: registerTool(`description: ${JSON.stringify('a'.repeat(501))}`),
      errors: [{ messageId: 'long' }],
    },
    {
      code: registerTool('description: "😀😀😀"'),
      options: [{ tool: 2 }],
      errors: [{ messageId: 'long', data: { length: 3, limit: 2 } }],
    },
    {
      code: registerTool(
        'inputSchema: {properties: {query: {description: "Search query"}}}',
      ),
      options: [{ parameter: 3 }],
      errors: [{ messageId: 'long' }],
    },
  ],
})

tester.run(
  'max-description-length serialization',
  rules['max-description-length'],
  {
    valid: serializedSchemas.map(schema => ({
      code: registerToolWithInputSchema(schema),
      options: [{ parameter: 3 }],
    })),
    invalid: [
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {description: "Ignored", toJSON: serialize}, other: {description: "Long"}}}',
        ),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {toJSON: {description: "Long"}}}',
        ),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
      {
        code: registerToolWithInputSchema(
          '{properties: {query: {$dynamicRef: "#query", description: "Long"}}}',
        ),
        options: [{ parameter: 3 }],
        errors: [{ messageId: 'long', data: { length: 4, limit: 3 } }],
      },
    ],
  },
)
