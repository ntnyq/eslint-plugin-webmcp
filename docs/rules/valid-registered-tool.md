# valid-registered-tool

Validate statically known RegisteredTool dictionaries.

Recommended: **error**. Strict: **error**. No automatic fix.

The first argument must be a RegisteredTool dictionary with name, description, window and origin. Statically known primitives and missing/undefined mandatory members are reported. Complete hand-written dictionaries are allowed; getTools provenance is not required. Interface-field types such as window are not fully validated.

## Incorrect

```js
document.modelContext.executeTool('search', {})
```

## Correct

```js
document.modelContext.executeTool(tool, {})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-registered-tool': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
