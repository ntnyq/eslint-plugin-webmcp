# valid-tool-name

Validate static tool names against the target API.

Recommended: **error**. Strict: **error**. No automatic fix.

Static strings must contain 1–128 ASCII letters, digits, underscores, hyphens or dots. Trailing line breaks are invalid. Non-string values are not implicitly converted by this analyzer.

## Incorrect

```js
document.modelContext.registerTool({ name: 'search products' })
```

## Correct

```js
document.modelContext.registerTool({ name: 'catalog.search-products' })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-tool-name': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
