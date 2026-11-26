# Repository Guidelines

## Project Structure & Module Organization

This is an ESM TypeScript ESLint plugin for browser WebMCP APIs.

- `src/index.ts` assembles and exports the plugin and flat configs.
- `src/rules/` defines each rule in its own file and registers them in `index.ts`.
- `src/constants/` holds shared constants and fixed API profiles.
- `src/types/` defines public and internal types.
- `src/utils/` contains shared helpers, including API recognition, bindings, and static values under `src/utils/analysis/`.
- Import shared constants, types, and utilities through their respective `index.ts` files from outside those directories.
- `tests/rules/` contains one test file per rule. `tests/` also contains integration and executable documentation tests.
- `docs/rules/<rule-name>.md` documents individual rules; `docs/analysis.md` and `docs/targets.md` define analysis boundaries and target contracts.
- `scripts/smoke.ts` checks the built package via tsx. `dist/` is generated output; do not edit it directly.

## Build, Test, and Development Commands

Use Node.js `^22.13.0 || >=24.0.0` and the pnpm version pinned in `package.json`.

- `pnpm install --frozen-lockfile`: install locked dependencies.
- `pnpm dev`: rebuild on changes with tsdown.
- `pnpm build`: generate the ESM bundle and declarations.
- Use `pnpm test` to run Vitest once or `pnpm test tests/rules/requireToolProperties.test.ts` to run one rule's tests.
- `pnpm format` / `pnpm format:check`: apply/check Oxfmt formatting.
- `pnpm lint` / `pnpm typecheck`: run Oxlint and strict TypeScript checks.
- `pnpm smoke`: verify package exports and JS/TS linting after building.
- `pnpm release:check`: run formatting, lint, types, tests, build, and smoke checks without publishing.

## Coding Style & Naming Conventions

Use two-space indentation, LF endings, single quotes, no semicolons, and trailing commas. Oxfmt sets an 80-column print width. Follow camelCase filenames and identifiers, PascalCase types, and kebab-case rule IDs such as `require-tool-properties`. Use separate `import type` declarations. Husky runs nano-staged formatting and lint fixes before commits.

### JSDoc

- Document every top-level type, constant, function, and class in `src/`, including private declarations. Use multiline JSDoc with `/**` and `*/` on separate lines, even for a one-sentence description.
- Document functions and methods with an `@param` tag for each parameter and an `@returns` tag that explains the result or describes how a `void` function reports its outcome. Document constructor parameters with `@param`. Add `@template` and `@throws` where applicable.
- Give each interface field its own multiline JSDoc describing its role, including defaults or constraints when applicable.

## Testing Guidelines

Use Vitest and `@typescript-eslint/rule-tester`. Name rule tests `tests/rules/<ruleName>.test.ts` after their source files. Name other tests `tests/<concern>.test.ts`. Add valid and invalid cases, asserting diagnostic `messageId` values. Cover conservative skips, shadowed globals, aliases, and target differences when relevant. No numeric coverage threshold is configured.

New rules need registry entries, rule-table updates, and documentation with `## Incorrect` and `## Correct` JavaScript examples; tests execute these examples.

## Analysis Contract

Preserve unknown values as unknown. Do not execute user code, fetch network resources, or introduce automatic edits. Keep behavior aligned with the fixed targets and `docs/analysis.md`.

## Commit & Pull Request Guidelines

Follow history's Conventional Commit style: `feat:`, `docs:`, `ci:`, or `chore(deps):`. Keep changes focused. PR descriptions should explain behavior changes, link relevant issues, and report validation. Update affected rule documentation and run `pnpm release:check` before requesting review.
