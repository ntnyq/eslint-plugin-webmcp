import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import {
  createRuleTester,
  registerTool,
  registerToolWithAnnotations,
} from '../helpers'

const tester = createRuleTester()

tester.run(
  'require-explicit-annotations',
  rules['require-explicit-annotations'],
  {
    valid: [
      registerTool(
        'annotations: {readOnlyHint: true, consequentialHint: false}',
      ),
      registerTool(
        'annotations: {readOnlyHint: dynamic, consequentialHint: evaluate()}',
      ),
      registerTool('annotations: {...unknown}'),
      registerTool('...unknown'),
      {
        code: registerTool('annotations: {untrustedContentHint: false}'),
        options: [{ fields: ['untrustedContentHint'] }],
      },
    ],
    invalid: [
      {
        code: registerTool(''),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: registerTool('annotations: {}'),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: registerTool('annotations: null'),
        errors: Array.from({ length: 2 }, () => ({
          messageId: 'missing' as const,
        })),
      },
      {
        code: registerTool('annotations: {readOnlyHint: true}'),
        errors: [{ messageId: 'missing', data: { name: 'consequentialHint' } }],
      },
      {
        code: registerTool(
          'annotations: {readOnlyHint: true, consequentialHint: undefined}',
        ),
        errors: [{ messageId: 'missing' }],
      },
    ],
  },
)

for (const { target, supportsDebugging } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
    `${target}: require-explicit-annotations`,
    rules['require-explicit-annotations'],
    {
      valid: [
        ...[
          '{ debugging: false }',
          '{ debugging: dynamic }',
          '{ ...unknown }',
        ].map(annotations => ({
          code: registerToolWithAnnotations(annotations),
          options: [{ fields: ['debugging'] }] satisfies [{ fields: string[] }],
        })),
        ...(supportsDebugging
          ? []
          : [
              {
                code: registerToolWithAnnotations('{}'),
                options: [{ fields: ['debugging'] }] satisfies [
                  { fields: string[] },
                ],
              },
            ]),
      ],
      invalid: supportsDebugging
        ? ['{}', '{ debugging: undefined }', 'null', 'undefined'].map(
            annotations => ({
              code: registerToolWithAnnotations(annotations),
              options: [{ fields: ['debugging'] }],
              errors: [
                { messageId: 'missing' as const, data: { name: 'debugging' } },
              ],
            }),
          )
        : [],
    },
  )
}
