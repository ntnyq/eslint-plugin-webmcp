# valid-registered-tool

Validate executeTool dictionaries or native Tool arguments by target.

Recommended: **error**. Strict: **error**. No automatic fix.

All draft targets and the September/October Chrome targets require a `RegisteredTool` dictionary with `name`, `description`, `window` and `origin`. Statically known primitives and missing/undefined mandatory members are reported. Complete hand-written dictionaries are allowed; `getTools()` provenance is not required. Interface-field types such as `window` are not fully validated.

`chrome-2026-11-07` requires a native `Tool` returned by `getTools()`. Primitives, object and array literals, function/class expressions, and copies such as `{ ...tool }` are reported once, without dictionary-member diagnostics. Object literals remain invalid even with unknown spreads, accessors or `Tool.prototype`: these cannot supply the native interface identity. Limited safe const aliases and TypeScript wrappers are followed.

Unresolved variables, imported handles, discovery results and arbitrary calls remain unknown and are skipped. The rule does not prove discovery provenance, handle freshness or registration lifetime. Explicit `call`/`apply`/`bind` forms and unbound calls are outside this check; `no-unbound-api-call` owns receiver errors.

## Incorrect

```js
document.modelContext.executeTool('search', {})
```

## Correct

```js
document.modelContext.executeTool(tool, {})
```

For the new Chrome target, keep the discovered handle instead of copying its metadata:

```js
const tools = await document.modelContext.getTools()
const tool = tools.find(tool => tool.name === 'search')
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
