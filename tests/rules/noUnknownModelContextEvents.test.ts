import { rules } from '../../src/rules'
import { targets } from '../fixtures/profiles'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()
const chrome = { webmcp: { target: 'chrome-2026-09-01' } }

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
        settings: chrome,
        errors: [{ messageId: 'unknown' }],
      },
    ],
  },
)

for (const { target, supportsDebugging } of targets) {
  const targetTester = createRuleTester(target)

  targetTester.run(
    `${target}: no-unknown-model-context-events`,
    rules['no-unknown-model-context-events'],
    {
      valid: [
        'document.modelContext.addEventListener("toolchange", refresh)',
        'document.modelContext.addEventListener(eventName, refresh)',
        'function f(document) { document.modelContext.addEventListener("custom", refresh) }',
        'other.addEventListener("custom", refresh)',
        {
          code: 'document.modelContext.addEventListener("custom", refresh)',
          options: [{ allowEvents: ['custom'] }],
        },
        ...(supportsDebugging
          ? [
              'const context = document.modelContext; context["addEventListener"]("toolactivated", refresh)',
              'document.modelContext?.removeEventListener("toolcancel", refresh)',
            ]
          : []),
      ],
      invalid: [
        {
          code: 'document.modelContext.addEventListener("toolchanged", refresh)',
          errors: [{ messageId: 'unknown' }],
        },
        ...(supportsDebugging
          ? []
          : ['toolactivated', 'toolcancel'].flatMap(event =>
              ['addEventListener', 'removeEventListener'].map(method => ({
                code: `document.modelContext.${method}("${event}", refresh)`,
                errors: [{ messageId: 'unknown' as const }],
              })),
            )),
      ],
    },
  )
}
