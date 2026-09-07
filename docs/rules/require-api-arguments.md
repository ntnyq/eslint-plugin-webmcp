# require-api-arguments

Require mandatory WebMCP call arguments.

Recommended: **error**. Strict: **error**. No automatic fix.

registerTool and executeTool require their tool argument. The Chrome target also requires the second executeTool input argument. getTools takes no required argument. Spreads with unknown arity are skipped and extra arguments are not rejected.

## Incorrect

```js
document.modelContext.registerTool()
```

## Correct

```js
document.modelContext.registerTool(tool)
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/require-api-arguments': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
