# API targets

The target is a static analysis contract, not browser feature detection. Diagnostics depend on the source, plugin version, rule options and `settings.webmcp`; they never query a browser or the network.

## draft-2026-09-04

The default profile follows the [WebMCP specification at commit 7b3f50f31848b529e69bedbbdf8da0edccba055f](https://github.com/webmachinelearning/webmcp/blob/7b3f50f31848b529e69bedbbdf8da0edccba055f/index.bs).

- `document.modelContext` provides `registerTool`, `getTools` and `executeTool`.
- Tool definitions require `name`, `description` and callable `execute`. `title`, `inputSchema` and `annotations` are optional.
- `executeTool` requires a RegisteredTool dictionary, including `name`, `description`, `window` and `origin`. Its input object is optional.
- Registration options are `exposedTo` and `signal`; discovery options are `fromOrigins`; execution options contain `signal`.
- Supported annotations are `readOnlyHint`, `untrustedContentHint` and `consequentialHint`.
- `provideContext`, `clearContext` and `unregisterTool` are removed methods.

The draft is a community proposal, not a W3C standard. Web IDL coercion matters: a non-string name is not automatically invalid, a synchronous callback is allowed, and annotation values are converted by truthiness. Quality rules describe authoring policies rather than claiming every warning causes a browser exception.

## chrome-2026-09-01

This profile combines the [Chrome imperative documentation dated 2026-09-01](https://developer.chrome.com/docs/ai/webmcp/imperative-api) with the explicitly inspected [Chromium ModelContext IDL at d9687b8cd9866b12d5c553630505fc5fb963f59d](https://chromium.googlesource.com/chromium/src/+/d9687b8cd9866b12d5c553630505fc5fb963f59d/third_party/blink/renderer/core/script_tools/model_context.idl).

The development snapshot reports Chromium 155.0.8044.0. It shares the modern document receiver, registration lifecycle, required dictionaries, events and options with the draft. Its consumer API requires a second `DOMString` JSON input argument, and discovery returns schema JSON text. The plugin checks the argument difference; discovery-result data flow is deferred.

```js
// draft-2026-09-04
await document.modelContext.executeTool(tool, { query: 'keyboard' })

// chrome-2026-09-01
await document.modelContext.executeTool(
  tool,
  JSON.stringify({ query: 'keyboard' }),
)
```

This profile does not select or claim support for a specific stable Chrome version. There is no `legacy-navigator` profile until a complete historical snapshot is specified and tested.

## Schema and origin references

- [JSON Schema 2020-12 validation vocabulary](https://json-schema.org/draft/2020-12/json-schema-validation.html): opt-in meta-schema validation. `required` does not need to be a subset of `properties`.
- [Web IDL ECMAScript bindings](https://webidl.spec.whatwg.org/#ecmascript-binding): dictionary, object, callback, boolean and sequence conversions.
- [Secure Contexts: potentially trustworthy origins](https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy): origin trust is environment-dependent; this release checks parseability, not a simplified HTTPS allowlist.
- [ESLint plugin documentation](https://eslint.org/docs/latest/extend/plugins): Flat Config plugin and preset contracts.

Sources were checked on 2026-09-07. The package never fetches them while linting.
