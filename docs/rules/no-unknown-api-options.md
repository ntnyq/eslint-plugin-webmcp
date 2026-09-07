# no-unknown-api-options

Catch unrecognized or misplaced API options.

Recommended: **—**. Strict: **warn**. No automatic fix.

Checks registerTool second argument (exposedTo/signal), getTools first argument (fromOrigins), and executeTool third argument (signal). allowOptions permits custom fields. Unknown fields may be ignored by the browser.

## Incorrect

```js
document.modelContext.registerTool(tool, { abortSignal: controller.signal })
```

## Correct

```js
document.modelContext.registerTool(tool, { signal: controller.signal })
```

Examples focus on this rule; other enabled rules can require additional tool fields.

## Configuration

```js
'webmcp/no-unknown-api-options': [
  "warn",
  {
    "allowOptions": []
  }
]
```

The values above are defaults. Object options can be overridden individually; unknown option keys are rejected.

See [shared analysis boundaries](../analysis.md) and [fixed upstream sources](../targets.md).
