# valid-input-schema

Check platform schema boundaries and optionally JSON Schema 2020-12 syntax.

Recommended: **error**. Strict: **error**. No automatic fix.

Platform mode checks fully known primitives/null and BigInt serialization failures. Optional mode json-schema with dialect 2020-12 checks the JSON representation against its meta-schema. Unknown values, toJSON, other declared dialects and dynamic schemas are skipped. No remote references, input validation, closed-object policy or required/properties subset rule is imposed.

In JSON Schema mode, a provided non-string `$schema` is invalid and cannot bypass validation as another dialect. `$schema: undefined` is omitted from JSON, so the configured 2020-12 dialect applies. Other string dialect declarations remain skipped.

## Incorrect

```js
document.modelContext.registerTool({ inputSchema: '{}' })
```

## Correct

```js
document.modelContext.registerTool({ inputSchema: { type: 'object' } })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-input-schema': [
  "warn",
  {
    "mode": "platform"
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
