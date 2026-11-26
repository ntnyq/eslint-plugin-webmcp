# valid-output-schema

Check platform schema boundaries and optionally JSON Schema 2020-12 syntax.

Recommended: **error**. Strict: **error**. No automatic fix.

Checks the optional `outputSchema` on tool definitions for all November targets. On September and October targets, `no-unknown-tool-properties` reports the unsupported field. Omitting the schema or explicitly setting it to `undefined` is allowed.

This rule shares the conservative validator used by `valid-input-schema`. Platform mode rejects fully known primitives/null and BigInt serialization failures. Arrays count as objects at the platform boundary. Unknown values, dynamic subtrees, cycles, accessors and `toJSON` are skipped. Opt-in JSON Schema mode validates the JSON representation against the 2020-12 meta-schema; other declared dialects are skipped, and remote references are never fetched.

In JSON Schema mode, a provided non-string `$schema` is invalid and cannot bypass validation as another dialect. `$schema: undefined` is omitted from JSON, so the configured 2020-12 dialect applies. Other string dialect declarations remain skipped.

Callback return values are not analyzed or validated against the schema. This rule does not require an MCP response envelope, output descriptions or an output schema.

## Incorrect

```js
document.modelContext.registerTool({ outputSchema: '{}' })
```

## Correct

```js
document.modelContext.registerTool({ outputSchema: { type: 'object' } })
```

Examples use the default `draft-2026-11-24` target. Other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-output-schema': ['error', { mode: 'platform' }]
```

The default mode checks platform boundaries. To check JSON Schema syntax:

```js
'webmcp/valid-output-schema': [
  'error',
  { mode: 'json-schema', dialect: '2020-12' },
]
```

The JSON Schema mode requires the explicit dialect. Unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
