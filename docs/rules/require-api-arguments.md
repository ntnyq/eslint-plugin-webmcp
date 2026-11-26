# require-api-arguments

Require mandatory WebMCP call arguments.

Recommended: **error**. Strict: **error**. No automatic fix.

`registerTool()` and `executeTool()` require their tool argument. Only `chrome-2026-09-01` also requires the second `executeTool()` input argument. `getTools()` has no required arguments. Spreads with unknown arity are skipped and extra arguments are not rejected.

On `draft-2026-11-24` and `chrome-2026-11-26`, `waitForToolsUntil()` requires an argument. The rule checks whether the argument was supplied. Web IDL converts supplied values, including thenables, to promises.

## Incorrect

```js
document.modelContext.waitForToolsUntil()
```

## Correct

```js
document.modelContext.waitForToolsUntil(pendingRegistration)
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/require-api-arguments': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
