# require-tool-properties

Require the mandatory tool definition fields.

Recommended: **error**. Strict: **error**. No automatic fix.

Required fields are name, description and execute. Explicit undefined counts as absent. inputSchema is optional. Unknown or inherited properties are skipped.

Array literals and safely resolved const array aliases are checked for missing required fields too. Unknown array elements do not supply named dictionary members. Mutated, shared or escaped aliases remain unknown.

## Incorrect

```js
document.modelContext.registerTool({ name: 'search' })
```

## Correct

```js
document.modelContext.registerTool({
  name: 'search',
  description: 'Search products',
  execute: search,
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/require-tool-properties': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
