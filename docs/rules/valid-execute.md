# valid-execute

Reject definitely non-callable execute values.

Recommended: **error**. Strict: **error**. No automatic fix.

Only provably non-callable values are rejected. Synchronous functions, async functions and dynamic callbacks are accepted. Explicit undefined is owned by require-tool-properties.

## Incorrect

```js
document.modelContext.registerTool({ execute: false })
```

## Correct

```js
document.modelContext.registerTool({
  execute() {
    return 'ok'
  },
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-execute': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
