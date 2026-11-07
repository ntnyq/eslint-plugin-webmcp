# no-unknown-tool-properties

Catch unrecognized tool definition properties.

Recommended: **—**. Strict: **warn**. No automatic fix.

All targets recognize name, title, description, inputSchema, execute and annotations. The November targets additionally recognize the optional outputSchema; September and October targets still report it as unknown. Unknown dictionary fields may be ignored by the platform. allowProperties permits application extensions.

## Incorrect

```js
document.modelContext.registerTool({ input_schema: {} })
```

## Correct

```js
document.modelContext.registerTool({ inputSchema: {} })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unknown-tool-properties': [
  "warn",
  {
    "allowProperties": []
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
