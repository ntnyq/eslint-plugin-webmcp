import assert from 'node:assert/strict'
import parser from '@typescript-eslint/parser'
import { ESLint } from 'eslint'
import plugin, { createConfig } from 'eslint-plugin-webmcp'
import type { WebMcpTarget } from 'eslint-plugin-webmcp'

const tool =
  '{name: "search", description: "Search products", execute() { return "ok" }}'
const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    plugin.configs.recommended,
    { files: ['**/*.ts'], languageOptions: { parser } },
  ],
})
const [javascript] = await eslint.lintText(
  `document.modelContext.registerTool(${tool})`,
  { filePath: 'example.js' },
)
const [typescript] = await eslint.lintText(
  `document.modelContext.registerTool(${tool} as const)`,
  { filePath: 'example.ts' },
)

assert.ok(javascript)
assert.deepEqual(javascript.messages, [])
assert.ok(typescript)
assert.deepEqual(typescript.messages, [])
const [invalid] = await eslint.lintText(
  'document.modelContext.registerTool({})',
  { filePath: 'example.js' },
)

assert.ok(invalid)
assert.equal(invalid.errorCount, 3)
assert.ok(invalid.messages[0])
assert.equal(invalid.messages[0].ruleId, 'webmcp/require-tool-properties')
await Promise.all(
  (
    [
      'draft-2026-09-04',
      'chrome-2026-09-01',
      'draft-2026-10-13',
      'chrome-2026-10-14',
      'draft-2026-11-02',
      'chrome-2026-11-07',
      'draft-2026-11-24',
      'chrome-2026-11-26',
    ] satisfies WebMcpTarget[]
  ).map(async target => {
    const instance = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [createConfig({ target, preset: 'strict' })],
    })
    const input = target === 'chrome-2026-09-01' ? '"{}"' : '{}'
    const [consumer] = await instance.lintText(
      `document.modelContext.executeTool(tool, ${input})`,
      { filePath: 'example.js' },
    )

    assert.ok(consumer)
    assert.deepEqual(consumer.messages, [])

    if (target !== 'draft-2026-09-04' && target !== 'chrome-2026-09-01') {
      const [modern] = await instance.lintText(
        `document.modelContext.registerTool({ ...${tool}, annotations: { debugging: false } });
       document.modelContext.executeTool(tool);
       document.modelContext.addEventListener('toolactivated', refresh);
       document.modelContext.removeEventListener('toolcancel', refresh);`,
        { filePath: 'example.js' },
      )

      assert.ok(modern)
      assert.deepEqual(modern.messages, [])
    }

    const supportsWaitForToolsUntil =
      target === 'draft-2026-11-24' || target === 'chrome-2026-11-26'
    const requiresNativeTool =
      supportsWaitForToolsUntil || target === 'chrome-2026-11-07'
    const supportsOutputSchema =
      requiresNativeTool || target === 'draft-2026-11-02'
    const [schema] = await instance.lintText(
      `document.modelContext.registerTool({ ...${tool}, outputSchema: null })`,
      { filePath: 'example.js' },
    )

    assert.ok(schema)
    assert.deepEqual(
      schema.messages.map(message => message.ruleId),
      [
        supportsOutputSchema
          ? 'webmcp/valid-output-schema'
          : 'webmcp/no-unknown-tool-properties',
      ],
    )
    const [dictionary] = await instance.lintText(
      `document.modelContext.executeTool({name: 'search', description: 'Search products', window, origin}, ${input})`,
      { filePath: 'example.js' },
    )

    assert.ok(dictionary)
    assert.deepEqual(
      dictionary.messages.map(message => message.messageId),
      requiresNativeTool ? ['native'] : [],
    )
    const [readiness] = await instance.lintText(
      `document.modelContext.waitForToolsUntil(Promise.resolve());
       document.modelContext.waitForToolsUntil();`,
      { filePath: 'example.js' },
    )

    assert.ok(readiness)
    assert.deepEqual(
      readiness.messages.map(message => [message.ruleId, message.messageId]),
      supportsWaitForToolsUntil
        ? [['webmcp/require-api-arguments', 'promise']]
        : [],
    )
  }),
)
assert.equal(Object.keys(plugin.rules).length, 25)
console.log(
  'Built package: 25 rules, JS/TS Flat Config and all eight targets verified.',
)
