import { readFile } from 'node:fs/promises'
import { Linter } from 'eslint'
import { expect, it } from 'vitest'
import plugin from '../src'

it.each(Object.keys(plugin.rules))(
  'documents executable examples for %s',
  async name => {
    const documentation = await readFile(
      new URL(`../docs/rules/${name}.md`, import.meta.url),
      'utf8',
    )
    const incorrect = /## Incorrect\s+```js\n(?<code>[\s\S]*?)```/u.exec(
      documentation,
    )?.groups?.['code']
    const correct = /## Correct\s+```js\n(?<code>[\s\S]*?)```/u.exec(
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
