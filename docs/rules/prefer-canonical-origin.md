# prefer-canonical-origin

Make origin-wide exposure explicit in URL options.

Recommended: **—**. Strict: **warn**. No automatic fix.

Reports credentials, non-root paths, queries and fragments because the permission matches the entire origin. A trailing root slash is accepted. Invalid URLs are left to valid-origin-list. No fix changes authorization scope.

## Incorrect

```js
document.modelContext.registerTool(tool, {
  exposedTo: ['https://agent.example/private?team=alpha'],
})
```

## Correct

```js
document.modelContext.registerTool(tool, {
  exposedTo: ['https://agent.example'],
})
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/prefer-canonical-origin': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
