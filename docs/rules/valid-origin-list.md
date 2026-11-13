# valid-origin-list

Validate known origin lists and absolute URL strings.

Recommended: **error**. Strict: **error**. No automatic fix.

Checks exposedTo and fromOrigins. Known primitive lists except undefined and plain object literals with no possible iterator are invalid. Static array members must be parseable absolute URLs after Web IDL string conversion, so primitive entries such as `null`, `undefined`, booleans and numbers are also reported. Array holes are read as `undefined`. Object entries and other iterable objects are left unknown because their conversion can execute user code. Dynamic entries do not prevent checking known siblings. Trustworthiness is not checked, so localhost and loopback HTTP origins are not rejected.

## Incorrect

```js
document.modelContext.registerTool(tool, { exposedTo: ['*', '/agent'] })
```

## Correct

```js
document.modelContext.registerTool(tool, {
  exposedTo: ['https://agent.example', 'http://localhost:3000'],
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-origin-list': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
