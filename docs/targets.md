# API targets

The target is a static analysis contract, not browser feature detection. Diagnostics depend on the source, plugin version, rule options and `settings.webmcp`; they never query a browser or the network.

## draft-2026-11-02

The default profile follows the [WebMCP specification at commit 6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2](https://github.com/webmachinelearning/webmcp/blob/6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2/index.bs), the community draft dated 2026-11-02, inspected on 2026-11-07.

It retains the October draft's document receiver, registration lifecycle, annotations, events and optional object input. Tool definitions and discovered `RegisteredTool` dictionaries add optional `object outputSchema`. The new `valid-output-schema` rule shares the input-schema platform and opt-in JSON Schema 2020-12 checks. No schema is required, and callback results are not analyzed. `executeTool` still accepts a `RegisteredTool` dictionary with `name`, `description`, `window` and `origin`.

## chrome-2026-11-07

This profile pins Chromium at [36c121be58126ddbb0686965897b8c8ff9b246fb](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb), inspected on 2026-11-07. Its development version is 159.0.8149.0; the target date identifies this inspection, not a stable Chrome release. The contract comes from the [ModelContext IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context.idl), [registration dictionary](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context_tool.idl) and [Tool IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/tool.idl).

Registration supports optional `outputSchema`, with the same checked schema boundaries as the November draft. Annotations, events, API options and optional object inputs retain October behavior.

The consumer contract differs: `getTools()` returns native `Tool` objects, and `executeTool()` requires one of these handles. A complete hand-written dictionary or `{ ...tool }` is insufficient because it lacks the native identity. `valid-registered-tool` rejects provably incompatible literals and copies instead of requiring dictionary fields. Unknown values are skipped; the plugin does not prove discovery provenance or handle freshness. Discovered `inputSchema`, `outputSchema` and `annotations` can be `null` when omitted at registration; discovery metadata use is outside current analysis.

The pinned implementation also contains `resumeTool()` and `waitForToolsUntil()` behind separate experimental flags. These methods and their options are outside this profile's checked surface; selecting this target does not enable experimental API validation. See the [review and deferred work](research/webmcp-standards-review-2026-11-07.md).

## Migrating to the November targets

The default target, both presets and manually enabled rules without target settings now use `draft-2026-11-02`. All four explicit September/October targets retain their original semantics.

- To keep the previous default diagnostics, pin `target: 'draft-2026-10-13'` in `createConfig` or `settings.webmcp.target`. Earlier September pins also remain supported.
- November targets recognize optional `outputSchema`. Earlier targets continue to report it through `no-unknown-tool-properties`; `valid-output-schema` skips unsupported targets even when manually enabled.
- `valid-output-schema` is an error in both presets. Its default platform mode accepts omission/`undefined`, rejects fully known primitives/null and BigInt serialization failures, and skips dynamic schemas. JSON Schema 2020-12 validation is opt-in, just as for `valid-input-schema`.
- When migrating to `chrome-2026-11-07`, pass the original `Tool` from `getTools()` into `executeTool()`. Do not reconstruct it from metadata or spread it. Draft targets continue accepting complete dictionaries.

```js
const [tool] = await document.modelContext.getTools()
if (tool) {
  await document.modelContext.executeTool(tool, { query: 'keyboard' })
}
```

## draft-2026-10-13

This historical profile follows the [WebMCP specification at commit eada13b575187ba9a523adc0c52e294ebdb6b597](https://github.com/webmachinelearning/webmcp/blob/eada13b575187ba9a523adc0c52e294ebdb6b597/index.bs), dated 2026-10-13.

It retains the September draft's document receiver, required tool dictionaries, registration lifecycle and API options. `executeTool` accepts an optional object input; omission supplies an empty object. Discovered `inputSchema` values are objects. The annotation set adds the boolean `debugging` field, and ModelContext declares `toolchange`, `toolactivated` and `toolcancel` events.

## chrome-2026-10-14

This profile pins the [Chromium ModelContext IDL at c954af10a8f0a843f40f7999f2b46daccd35868e](https://chromium.googlesource.com/chromium/src/+/c954af10a8f0a843f40f7999f2b46daccd35868e/third_party/blink/renderer/core/script_tools/model_context.idl) and its [tool/annotation dictionaries](https://chromium.googlesource.com/chromium/src/+/c954af10a8f0a843f40f7999f2b46daccd35868e/third_party/blink/renderer/core/script_tools/model_context_tool.idl), inspected on 2026-10-14. The development snapshot reports Chromium 158.0.8104.0; the target date identifies this inspection, not a stable Chrome release.

The checked input, annotation and event contracts match `draft-2026-10-13`. In particular, `executeTool` accepts an optional object input and discovery returns schema objects. Return-value differences and discovery-result data flow are not analyzed by this release. The [Chrome imperative guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api#execute_tool) documents the move away from JSON text input from Chrome 155.

## Migrating to the October targets

The October update changed the default target to `draft-2026-10-13`. The November update above supersedes that default; these migration differences still apply to explicit October targets. Explicit September targets retain their original semantics.

- To keep previous default diagnostics, set `target: 'draft-2026-09-04'` in `createConfig`, or set `settings.webmcp.target` to that value.
- When migrating from `chrome-2026-09-01` to `chrome-2026-10-14`, pass an input object directly instead of serialized JSON text. Omit the second argument for tools with no inputs.
- October targets recognize `annotations.debugging` and the `toolactivated`/`toolcancel` events on `document.modelContext`. The September targets still report these as unknown.
- `require-explicit-annotations` accepts `debugging` in its `fields` option. It skips fields unsupported by the selected target, allowing a shared rule policy without requiring unsupported annotations on older targets. Its default fields are unchanged.

The event rule checks `addEventListener`/`removeEventListener` calls. It does not migrate legacy `window.ontoolactivated`/`window.ontoolcancel` assignments; the [Chrome declarative guide](https://developer.chrome.com/docs/ai/webmcp/declarative-api) documents their removal from Chrome 156.

## draft-2026-09-04

This historical profile follows the [WebMCP specification at commit 7b3f50f31848b529e69bedbbdf8da0edccba055f](https://github.com/webmachinelearning/webmcp/blob/7b3f50f31848b529e69bedbbdf8da0edccba055f/index.bs).

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

September sources were checked on 2026-09-07; October sources were checked on 2026-10-14; November sources were checked on 2026-11-07. The package never fetches them while linting.
