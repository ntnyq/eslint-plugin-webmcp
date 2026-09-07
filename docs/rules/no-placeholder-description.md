# no-placeholder-description

Replace complete placeholder descriptions with useful text.

Recommended: **—**. Strict: **warn**. No automatic fix.

Matches the entire trimmed description case-insensitively against placeholders. Defaults are TODO, TBD and FIXME. An explicit placeholders array replaces this list; embedded occurrences and empty descriptions do not trigger this rule.

## Incorrect

```js
document.modelContext.registerTool({ description: 'TODO' })
```

## Correct

```js
document.modelContext.registerTool({
  description: 'List TODO comments in this project',
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-placeholder-description': [
  "warn",
  {
    "placeholders": [
      "TODO",
      "TBD",
      "FIXME"
    ]
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
