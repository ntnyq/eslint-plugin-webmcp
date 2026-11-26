# no-unsupported-api

Report legacy WebMCP entry points and removed methods.

Recommended: **error**. Strict: **error**. No automatic fix.

All targets use the document receiver. Calls to provideContext, clearContext and unregisterTool are migration errors. This rule does not rewrite an API migration.

For `draft-2026-11-24` and `chrome-2026-11-26`, using `navigator.modelContext.waitForToolsUntil()` also triggers the legacy-receiver diagnostic.

## Incorrect

```js
navigator.modelContext.registerTool(tool)
```

## Correct

```js
document.modelContext.registerTool(tool, { signal: controller.signal })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unsupported-api': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
