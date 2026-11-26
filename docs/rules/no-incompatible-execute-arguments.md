# no-incompatible-execute-arguments

Use the executeTool input representation required by the target.

Recommended: **error**. Strict: **error**. No automatic fix.

Examples use the default `draft-2026-11-24` target. Only `chrome-2026-09-01` requires JSON text and reports object or array syntax. `require-api-arguments` checks its required second argument. All other targets expect an optional object. Dynamic expressions are skipped.

## Incorrect

```js
document.modelContext.executeTool(tool, '{}')
```

## Correct

```js
document.modelContext.executeTool(tool, {})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-incompatible-execute-arguments': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
