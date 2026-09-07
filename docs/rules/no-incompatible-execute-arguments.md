# no-incompatible-execute-arguments

Use the executeTool input representation required by the target.

Recommended: **error**. Strict: **error**. No automatic fix.

Examples use the default draft target. The draft expects an optional object. The Chrome target expects JSON text and warns on object/array syntax; require-api-arguments owns its required second argument. Dynamic expressions are skipped.

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
