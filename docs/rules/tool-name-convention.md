# tool-name-convention

Apply a project-specific naming convention to valid tool names.

Recommended: **—**. Strict: **—**. No automatic fix.

Optional policy, default snake_case. style also accepts kebab-case, camelCase or dot-separated. prefix must match exactly and is stripped before style checks. dot-separated validates each remaining segment using segmentStyle (default kebab-case). Names invalid under the native character/length contract are skipped to avoid duplicate reports.

## Incorrect

```js
document.modelContext.registerTool({ name: 'search-products' })
```

## Correct

```js
document.modelContext.registerTool({ name: 'search_products' })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/tool-name-convention': [
  "warn",
  {
    "style": "snake_case",
    "segmentStyle": "kebab-case",
    "prefix": ""
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
