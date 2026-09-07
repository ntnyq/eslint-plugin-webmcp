# no-preaborted-registration-signal

Avoid registering with an already-aborted signal.

Recommended: **—**. Strict: **warn**. No automatic fix.

Recognizes direct AbortSignal.abort() and safe local const aliases of its result. The global identifier must be unshadowed. This release does not trace prior controller.abort() calls, branches or asynchronous cancellation. Execution signals are outside this registration rule.

## Incorrect

```js
document.modelContext.registerTool(tool, { signal: AbortSignal.abort() })
```

## Correct

```js
document.modelContext.registerTool(tool, { signal: controller.signal })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-preaborted-registration-signal': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
