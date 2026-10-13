# valid-annotations

Use supported hint names and explicit boolean values.

Recommended: **—**. Strict: **warn**. No automatic fix.

All targets recognize readOnlyHint, untrustedContentHint and consequentialHint. The October targets also recognize debugging; September targets report it as unknown. Statically known values other than boolean/undefined produce authoring warnings; strings such as false are truthy. Unknown hints may be ignored rather than throwing. Annotations cannot prove safety or callback side effects.

## Incorrect

```js
document.modelContext.registerTool({ annotations: { readOnlyHint: 'false' } })
```

## Correct

```js
document.modelContext.registerTool({ annotations: { readOnlyHint: false } })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/valid-annotations': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
