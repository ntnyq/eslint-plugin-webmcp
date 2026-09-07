# prefer-tool-title

Opt into human-readable tool titles.

Recommended: **—**. Strict: **—**. No automatic fix.

Optional product policy: require a provided title that is not known to be undefined, empty or whitespace-only. Dynamic localization functions satisfy presence. The native API does not require a title.

## Incorrect

```js
document.modelContext.registerTool({ name: 'search' })
```

## Correct

```js
document.modelContext.registerTool({ name: 'search', title: 'Search products' })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/prefer-tool-title': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
