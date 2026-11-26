# no-unbound-api-call

Keep the native ModelContext receiver when calling its methods.

Recommended: **error**. Strict: **error**. No automatic fix.

Identifies extracted native methods, including destructuring and sequence expressions. Explicit bind/call/apply forms are skipped; they do not trigger unbound diagnostics.

The rule checks `waitForToolsUntil()` for `draft-2026-11-24` and `chrome-2026-11-26`.

## Incorrect

```js
const { waitForToolsUntil } = document.modelContext
waitForToolsUntil(pendingRegistration)
```

## Correct

```js
document.modelContext.waitForToolsUntil(pendingRegistration)
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unbound-api-call': 'warn'
```

This rule has no options.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
