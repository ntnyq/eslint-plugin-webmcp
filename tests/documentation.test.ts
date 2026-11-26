import { readFile } from 'node:fs/promises'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import plugin from '../src'

describe.each([
  { lineEnding: 'LF', newline: '\n' },
  { lineEnding: 'CRLF', newline: '\r\n' },
])('documentation with $lineEnding line endings', ({ newline }) => {
  it.each(Object.keys(plugin.rules))(
    'documents executable examples for %s',
    async name => {
      const source = await readFile(
        new URL(`../docs/rules/${name}.md`, import.meta.url),
        'utf8',
      )
      const documentation = source.replaceAll(/\r?\n/gu, newline)
      const incorrect = /## Incorrect\s+```js\r?\n(?<code>[\s\S]*?)```/u.exec(
        documentation,
      )?.groups?.['code']
      const correct = /## Correct\s+```js\r?\n(?<code>[\s\S]*?)```/u.exec(
        documentation,
      )?.groups?.['code']

      if (!incorrect || !correct) {
        throw new Error(`Missing documentation examples for ${name}`)
      }

      const linter = new Linter()
      const config = {
        plugins: { webmcp: plugin },
        rules: { [`webmcp/${name}`]: 'error' as const },
      }

      expect(
        linter
          .verify(incorrect, config)
          .some(message => message.ruleId === `webmcp/${name}`),
      ).toBe(true)
      expect(linter.verify(correct, config)).toStrictEqual([])
    },
  )
})
