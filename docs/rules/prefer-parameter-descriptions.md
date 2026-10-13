# prefer-parameter-descriptions

Describe statically known input parameters.

Recommended: **—**. Strict: **warn**. No automatic fix.

Visits properties inside schema keywords, including nested and composed schemas. Requires a provided nonempty description where absence is provable. Dynamic descriptions, boolean schemas and `$ref`/`$dynamicRef` parameter objects are skipped. Branches that could be replaced by a `toJSON` serializer are skipped, while unaffected siblings are checked. Examples/default data are not traversed as schemas.

## Incorrect

```js
document.modelContext.registerTool({
  inputSchema: { properties: { query: { type: 'string' } } },
})
```

## Correct

```js
document.modelContext.registerTool({
  inputSchema: {
    properties: { query: { type: 'string', description: 'Search keywords' } },
  },
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/prefer-parameter-descriptions': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
