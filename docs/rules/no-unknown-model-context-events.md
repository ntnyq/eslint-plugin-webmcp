# no-unknown-model-context-events

Catch unrecognized native ModelContext event names.

Recommended: **—**. Strict: **warn**. No automatic fix.

Checks static event names in native addEventListener/removeEventListener calls. toolchange is the only declared native event. EventTarget custom events are legal; list intentional names in allowEvents. Other EventTargets are excluded.

## Incorrect

```js
document.modelContext.addEventListener('toolschange', refresh)
```

## Correct

```js
document.modelContext.addEventListener('toolchange', refresh)
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unknown-model-context-events': [
  "warn",
  {
    "allowEvents": []
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
