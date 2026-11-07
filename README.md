# eslint-plugin-webmcp

[![CI](https://github.com/ntnyq/eslint-plugin-webmcp/workflows/CI/badge.svg)](https://github.com/ntnyq/eslint-plugin-webmcp/actions)
[![NPM VERSION](https://img.shields.io/npm/v/eslint-plugin-webmcp.svg)](https://www.npmjs.com/package/eslint-plugin-webmcp)
[![LICENSE](https://img.shields.io/github/license/ntnyq/eslint-plugin-webmcp.svg)](https://github.com/ntnyq/eslint-plugin-webmcp/blob/main/LICENSE)

Conservative ESLint rules for browser WebMCP tool definitions and consumers. Includes **25 rules**, `recommended` and `strict` Flat Config presets, and six fixed API targets.

Requires ESLint 9 or 10 and Node.js `^22.13.0 || >=24.0.0`. ESM only. This initial implementation covers imperative JavaScript and TypeScript; it does not lint HTML or Vue templates.

## Install

```sh
pnpm add -D eslint eslint-plugin-webmcp
```

For an unpublished checkout, run `pnpm install && pnpm build && pnpm pack` and install the generated tarball in the consuming project.

## Usage

```js
// eslint.config.mjs
import webmcp from 'eslint-plugin-webmcp'

export default [webmcp.configs.recommended]
```

The presets select JS/TS file extensions and never replace your parser or enable type services. Supply a parser when linting TypeScript:

```js
import parser from '@typescript-eslint/parser'
import webmcp from 'eslint-plugin-webmcp'

export default [
  webmcp.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
]
```

Install `@typescript-eslint/parser` separately. This checkout tests typescript-eslint 8.71 with the TypeScript 6 compatibility API and uses TypeScript 7 for type checking. The development aliases `typescript` → `@typescript/typescript6` and `@typescript/native` → `typescript` follow the [official side-by-side installation guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0). Follow your parser's supported TypeScript range.

## Fixed API targets

```js
import { createConfig } from 'eslint-plugin-webmcp'

export default [
  createConfig({
    target: 'chrome-2026-11-07',
    preset: 'strict',
    files: ['src/**/*.{js,ts,tsx}'],
  }),
]
```

All targets use `document.modelContext`.

| Target                       | `executeTool` first argument | `executeTool` input | `outputSchema` |
| ---------------------------- | ---------------------------- | ------------------- | -------------- |
| `draft-2026-11-02` (default) | `RegisteredTool` dictionary  | Optional object     | Supported      |
| `chrome-2026-11-07`          | Native `Tool` handle         | Optional object     | Supported      |
| `draft-2026-10-13`           | `RegisteredTool` dictionary  | Optional object     | Unsupported    |
| `chrome-2026-10-14`          | `RegisteredTool` dictionary  | Optional object     | Unsupported    |
| `draft-2026-09-04`           | `RegisteredTool` dictionary  | Optional object     | Unsupported    |
| `chrome-2026-09-01`          | `RegisteredTool` dictionary  | Required JSON text  | Unsupported    |

All snapshots use Promise-based registration, `options.signal` for unregistration and the `toolchange` event. The October and November targets also support `annotations.debugging`, `toolactivated` and `toolcancel`. Optional object input defaults to `{}`. Chrome profiles are backed by fixed Chromium development commits; they do not claim that every Chrome release implements those snapshots. See [sources and snapshot details](docs/targets.md).

Manual configurations can set `settings: { webmcp: { target: 'draft-2026-11-02' } }`. Unknown targets, presets, invalid file lists and malformed wrapper settings produce configuration errors. There is no floating `latest` or partially supported legacy target.

The default is now `draft-2026-11-02`, including both presets and rules without explicit settings. Pin `draft-2026-10-13` to retain the previous default diagnostics. All four explicit September/October targets retain their original API contracts, including treating `outputSchema` as unsupported. For `chrome-2026-11-07`, pass the original `Tool` returned by `getTools()`; object copies and hand-written dictionaries lack its native identity. See the [November migration notes](docs/targets.md#migrating-to-the-november-targets).

## Rules and presets

`recommended` enables provable API errors and the empty-description warning. `strict` includes recommended and additional metadata, option, origin and description warnings. Team-specific naming, titles, length budgets and explicit hint requirements remain opt-in.

See the [complete rule table](docs/rules.md) for all 25 rules, defaults, examples and options. No rule automatically changes names, descriptions, callbacks, origins or registration lifetimes.

```js
import webmcp from 'eslint-plugin-webmcp'

export default [
  webmcp.configs.strict,
  {
    rules: {
      'webmcp/valid-input-schema': [
        'error',
        { mode: 'json-schema', dialect: '2020-12' },
      ],
      'webmcp/valid-output-schema': [
        'error',
        { mode: 'json-schema', dialect: '2020-12' },
      ],
      'webmcp/tool-name-convention': [
        'warn',
        {
          style: 'dot-separated',
          segmentStyle: 'kebab-case',
          prefix: 'catalog.',
        },
      ],
      'webmcp/require-explicit-annotations': [
        'warn',
        { fields: ['readOnlyHint', 'consequentialHint'] },
      ],
    },
  },
]
```

By default, `valid-input-schema` and `valid-output-schema` check only known platform boundary failures. The output rule applies only to November targets and keeps the field optional. Their opt-in JSON Schema mode validates the JSON representation against the 2020-12 meta-schema. It does not enforce object roots, closed properties or parameter descriptions, validate tool inputs or callback results at runtime, resolve remote references, or execute user code. Other explicitly declared dialects are skipped.

## Tool-definition wrappers

Recognize a project factory through its import binding, including renamed imports:

```js
export default [
  webmcp.configs.recommended,
  {
    settings: {
      webmcp: {
        wrappers: [
          {
            module: '@app/webmcp',
            imported: 'defineWebMcpTool',
            toolArgument: 0,
            kind: 'definition',
          },
        ],
      },
    },
  },
]
```

Only named imports are recognized. Definition factories do not imply registration, cancellation or Promise semantics. Modules are never loaded by the analyzer.

## Analysis boundaries

Direct `document`, `window.document` and `globalThis.document` receivers, static computed keys, optional chaining, TypeScript wrappers, and limited const aliases are supported. Local bindings that shadow platform globals are excluded. Unknown spreads and computed keys invalidate preceding fields; later explicit fields remain analyzable. Getters, setters and `__proto__` providers cause the object to be skipped.

Object aliases must have a single read in the same execution scope and no writes, exports or escapes. Shared definitions and cross-function objects are intentionally skipped. This favors useful, predictable diagnostics over speculative data flow. See [analysis details](docs/analysis.md) and the [remaining design roadmap](docs/roadmap.md).

## Development

```sh
pnpm install --frozen-lockfile
pnpm release:check
pnpm pack --dry-run
```

`release:check` runs formatting, lint, type checks, RuleTester/integration tests, the declaration build and a JS/TS smoke test imported through the package export. It does not publish the package.

## License

[MIT](./LICENSE) License © 2026-PRESENT [ntnyq](https://github.com/ntnyq)
