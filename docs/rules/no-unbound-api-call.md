# no-unbound-api-call

Keep the native ModelContext receiver when calling its methods.

Recommended: **error**. Strict: **error**. No automatic fix.

Identifies extracted native methods, including destructuring and sequence expressions. Explicit bind/call/apply forms are skipped; they do not trigger unbound diagnostics.

## Incorrect

```js
const { registerTool } = document.modelContext
registerTool(tool)
```

## Correct

```js
document.modelContext.registerTool(tool)
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unbound-api-call': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
