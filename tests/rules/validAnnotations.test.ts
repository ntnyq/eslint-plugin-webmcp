import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import {
  createRuleTester,
  registerTool,
  registerToolWithAnnotations,
} from '../helpers'

const tester = createRuleTester()

tester.run('valid-annotations', rules['valid-annotations'], {
  valid: [
    registerTool(
      'annotations: {readOnlyHint: true, untrustedContentHint: false, consequentialHint: false}',
    ),
    registerTool('annotations: {readOnlyHint: dynamic}'),
    registerTool('annotations: {...unknown}'),
    registerTool('annotations: undefined'),
    registerTool('annotations: null'),
    registerTool('annotations: {readOnlyHint: undefined}'),
  ],
  invalid: [
    {
      code: registerTool('annotations: {destructiveHint: true}'),
      errors: [{ messageId: 'unknown' }],
    },
    {
      code: registerTool('annotations: {readOnlyHint: "false"}'),
      errors: [{ messageId: 'boolean' }],
    },
    {
      code: registerTool('annotations: {readOnlyHint: 0}'),
      errors: [{ messageId: 'boolean' }],
    },
    {
      code: registerTool('annotations: "readonly"'),
      errors: [{ messageId: 'dictionary' }],
    },
  ],
})

for (const { target, supportsDebugging } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(`${target}: valid-annotations`, rules['valid-annotations'], {
    valid: [
      registerToolWithAnnotations('{ readOnlyHint: true }'),
      registerToolWithAnnotations('{ ...unknown }'),
      'function f(document) { document.modelContext.registerTool({ annotations: { debugging: "false" } }) }',
      ...(supportsDebugging
        ? ['true', 'false', 'undefined', 'dynamic'].map(value =>
            registerToolWithAnnotations(`{ debugging: ${value} }`),
          )
        : []),
    ],
    invalid: [
      {
        code: registerToolWithAnnotations('{ debugging: "false" }'),
        errors: [{ messageId: supportsDebugging ? 'boolean' : 'unknown' }],
      },
      ...(supportsDebugging
        ? []
        : [
            {
              code: registerToolWithAnnotations('{ debugging: true }'),
              errors: [{ messageId: 'unknown' as const }],
            },
          ]),
    ],
  })
}
