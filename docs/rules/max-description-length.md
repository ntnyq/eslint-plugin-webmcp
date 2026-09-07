# max-description-length

Apply configurable Unicode code-point budgets to descriptions.

Recommended: **—**. Strict: **—**. No automatic fix.

Optional code-point budgets, defaulting to tool 500 and parameter 150. These are configurable authoring limits, not browser or token limits. unit accepts codePoint. Surrogate pairs count as one code point. No text is truncated.

## Incorrect

```js
/* eslint webmcp/max-description-length: ["warn", { "tool": 20 }] */
document.modelContext.registerTool({
  description: 'Search all products in the catalog',
})
```

## Correct

```js
document.modelContext.registerTool({ description: 'Search products' })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/max-description-length': [
  "warn",
  {
    "tool": 500,
    "parameter": 150,
    "unit": "codePoint"
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
