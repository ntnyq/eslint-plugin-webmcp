# valid-registered-tool

Validate executeTool dictionaries or native Tool arguments by target.

Recommended: **error**. Strict: **error**. No automatic fix.

The September and October targets and `draft-2026-11-02` require a `RegisteredTool` dictionary with `name`, `description`, `window` and `origin`. Statically known primitives and missing or undefined mandatory members are reported. Complete hand-written dictionaries are allowed. Interface-field types such as `window` are not fully validated.

Array literals and safely resolved const array aliases lack these named required members and are reported, even when their elements are unknown. Mutated, shared or escaped aliases remain unknown.

`draft-2026-11-24` and both November Chrome targets require a native `Tool` returned by `getTools()`. Primitives, object and array literals, function and class expressions, and copies such as `{ ...tool }` are reported once. Unknown spreads, accessors and `Tool.prototype` cannot supply the native interface identity. Limited safe const aliases and TypeScript wrappers are followed.

Unresolved variables, imported handles, discovery results and arbitrary calls remain unknown and are skipped. The rule does not prove discovery provenance, handle freshness or registration lifetime. Explicit `call`/`apply`/`bind` forms and unbound calls are outside this check; `no-unbound-api-call` owns receiver errors.

## Incorrect

```js
const [tool] = await document.modelContext.getTools()
document.modelContext.executeTool({ ...tool }, {})
```

## Correct

```js
const [tool] = await document.modelContext.getTools()
if (tool) {
  await document.modelContext.executeTool(tool, { query: 'keyboard' })
}
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-registered-tool': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
