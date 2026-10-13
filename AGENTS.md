# Repository Guidelines

## Project Structure & Module Organization

This is an ESM TypeScript ESLint plugin for browser WebMCP APIs.

- `src/index.ts` exports the plugin and flat configs; `src/profiles.ts` defines fixed API targets.
- `src/rules/` groups rules by concern and registers them in `index.ts`; `src/createRule.ts` provides shared rule construction.
- `src/analysis/` handles API recognition, bindings, and static values.
- `tests/` contains rule, integration, and executable documentation tests.
- `docs/rules/<rule-name>.md` documents individual rules; `docs/analysis.md` and `docs/targets.md` define analysis boundaries and target contracts.
- `scripts/smoke.ts` checks the built package via tsx. `dist/` is generated output; do not edit it directly.

## Build, Test, and Development Commands

Use Node.js `^22.13.0 || >=24.0.0` and the pnpm version pinned in `package.json`.

- `pnpm install --frozen-lockfile`: install locked dependencies.
- `pnpm dev`: rebuild on changes with tsdown.
- `pnpm build`: generate the ESM bundle and declarations.
- `pnpm test`: run Vitest once; `pnpm test tests/core.test.ts` targets one file.
- `pnpm format` / `pnpm format:check`: apply/check Oxfmt formatting.
- `pnpm lint` / `pnpm typecheck`: run Oxlint and strict TypeScript checks.
- `pnpm smoke`: verify package exports and JS/TS linting after building.
- `pnpm release:check`: run formatting, lint, types, tests, build, and smoke checks without publishing.

## Coding Style & Naming Conventions

Use two-space indentation, LF endings, single quotes, no semicolons, and trailing commas. Oxfmt sets an 80-column print width. Follow camelCase filenames and identifiers, PascalCase types, and kebab-case rule IDs such as `require-tool-properties`. Use separate `import type` declarations. Husky runs nano-staged formatting and lint fixes before commits.

## Testing Guidelines

Use Vitest and `@typescript-eslint/rule-tester`; name tests `tests/<concern>.test.ts`. Add valid and invalid cases, asserting diagnostic `messageId` values. Cover conservative skips, shadowed globals, aliases, and target differences when relevant. No numeric coverage threshold is configured.

New rules need registry entries, rule-table updates, and documentation with `## Incorrect` and `## Correct` JavaScript examples; tests execute these examples.

## Analysis Contract

Preserve unknown values as unknown. Do not execute user code, fetch network resources, or introduce automatic edits. Keep behavior aligned with the fixed targets and `docs/analysis.md`.

## Commit & Pull Request Guidelines

Follow history's Conventional Commit style: `feat:`, `docs:`, `ci:`, or `chore(deps):`. Keep changes focused. PR descriptions should explain behavior changes, link relevant issues, and report validation. Update affected rule documentation and run `pnpm release:check` before requesting review.
