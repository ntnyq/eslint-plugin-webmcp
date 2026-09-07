import assert from 'node:assert/strict'
import parser from '@typescript-eslint/parser'
import { ESLint } from 'eslint'
import plugin, { createConfig } from 'eslint-plugin-webmcp'

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
assert.deepEqual(javascript.messages, [])
assert.deepEqual(typescript.messages, [])
const [invalid] = await eslint.lintText(
  'document.modelContext.registerTool({})',
  { filePath: 'example.js' },
)
assert.equal(invalid.errorCount, 3)
assert.equal(invalid.messages[0].ruleId, 'webmcp/require-tool-properties')
const chrome = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [createConfig({ target: 'chrome-2026-09-01' })],
})
const [consumer] = await chrome.lintText(
  'document.modelContext.executeTool(tool, "{}")',
  { filePath: 'example.js' },
)
assert.deepEqual(consumer.messages, [])
assert.equal(Object.keys(plugin.rules).length, 24)
console.log(
  'Built package: 24 rules, JS/TS Flat Config and Chrome target verified.',
)
