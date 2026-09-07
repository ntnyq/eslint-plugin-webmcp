# require-explicit-annotations

Require explicit evaluation of configured tool hints.

Recommended: **—**. Strict: **—**. No automatic fix.

Optional policy to explicitly evaluate selected fields, default readOnlyHint and consequentialHint. Missing or undefined hints are reported; unknown spreads/dynamic hints are skipped. fields accepts only the three native annotation names. It never chooses true or false for the author.

## Incorrect

```js
document.modelContext.registerTool({ annotations: {} })
```

## Correct

```js
document.modelContext.registerTool({
  annotations: { readOnlyHint: true, consequentialHint: false },
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/require-explicit-annotations': [
  "warn",
  {
    "fields": [
      "readOnlyHint",
      "consequentialHint"
    ]
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
