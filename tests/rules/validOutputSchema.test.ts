import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { schemaCases } from '../fixtures/schemas'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()

tester.run(
  'valid-output-schema',
  rules['valid-output-schema'],
  schemaCases('outputSchema'),
)

for (const { target, supportsOutputSchema } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
    `${target}: valid-output-schema`,
    rules['valid-output-schema'],
    {
      valid: [
        'document.modelContext.registerTool({})',
        'document.modelContext.registerTool({outputSchema: undefined})',
        'document.modelContext.registerTool({outputSchema: {type: "object"}})',
        'document.modelContext.registerTool({outputSchema: unknownSchema})',
        ...(supportsOutputSchema
          ? []
          : ['null', '1n', '{const: 1n}'].map(
              schema =>
                `document.modelContext.registerTool({outputSchema: ${schema}})`,
            )),
        ...(supportsOutputSchema
          ? []
          : [
              {
                code: 'document.modelContext.registerTool({outputSchema: {type: "made-up"}})',
                options: [{ mode: 'json-schema', dialect: '2020-12' }] as const,
              },
            ]),
      ],
      invalid: supportsOutputSchema
        ? [
            {
              code: 'document.modelContext.registerTool({outputSchema: null})',
              errors: [{ messageId: 'object' }],
            },
            {
              code: 'document.modelContext.registerTool({outputSchema: {const: 1n}})',
              errors: [{ messageId: 'serialization' }],
            },
            {
              code: 'document.modelContext.registerTool({outputSchema: {type: "made-up"}})',
              options: [{ mode: 'json-schema', dialect: '2020-12' }] as const,
              errors: [{ messageId: 'schema' }],
            },
          ]
        : [],
    },
  )
}
