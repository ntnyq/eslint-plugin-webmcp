# valid-abort-signal

Reject values that are definitely not AbortSignals.

Recommended: **error**. Strict: **error**. No automatic fix.

Checks registerTool and executeTool signal options. Rejects known primitives except undefined, object/array/function literals, and the unshadowed AbortController constructor. Unknown factories, custom instances and controller.signal are skipped. It does not use realm-dependent instanceof checks.

## Incorrect

```js
document.modelContext.registerTool(tool, { signal: new AbortController() })
```

## Correct

```js
document.modelContext.registerTool(tool, { signal: controller.signal })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-abort-signal': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
