# no-empty-description

Require nonempty, non-whitespace tool descriptions.

Recommended: **warn**. Strict: **warn**. No automatic fix.

Empty strings and whitespace-only strings are warned. Whitespace trimming is a plugin quality policy. No language or minimum-length requirement is imposed.

## Incorrect

```js
document.modelContext.registerTool({ description: '  ' })
```

## Correct

```js
document.modelContext.registerTool({
  description: 'Search the product catalog',
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-empty-description': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
