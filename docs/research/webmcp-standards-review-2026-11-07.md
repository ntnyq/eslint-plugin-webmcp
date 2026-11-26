# WebMCP standards review — 2026-11-07

## Scope and source snapshots

This review compares the repository's October targets with official sources
available on 2026-11-07. Existing dated targets are historical contracts; a
difference from today's upstream is not, by itself, a bug in those contracts.
No browser runtime was exercised in this review.

- The current community report is dated 2026-11-02. It explicitly says that it
  is neither a W3C Standard nor on the W3C Standards Track. Its repository head
  is [6cd745ac](https://github.com/webmachinelearning/webmcp/commit/6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2).
  See the [published report and status](https://webmachinelearning.github.io/webmcp/#sotd).
- The Chromium development snapshot inspected here is
  [36c121be](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb),
  committed on 2026-11-07. Its
  [version file](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/chrome/VERSION)
  says 159.0.8149.0. This identifies a development snapshot, not a stable Chrome
  support claim.
- Chrome's [imperative guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
  was last updated on 2026-10-16; its
  [declarative guide](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
  was last updated on 2026-09-25. Source IDL is used where those guides lag the
  development implementation.

## Recommended updates

### 1. Add a November draft target with output schema support

On 2026-11-02, merged [PR #254](https://github.com/webmachinelearning/webmcp/pull/254)
added optional `object outputSchema` to both `ModelContextTool` and
`RegisteredTool`. The output schema describes the callback's output; agents may
reject a result that does not conform. The declaration does not require an MCP
`content` envelope. See the pinned
[tool dictionary](https://github.com/webmachinelearning/webmcp/blob/6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2/index.bs#L1224)
and [registered tool dictionary](https://github.com/webmachinelearning/webmcp/blob/6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2/index.bs#L1380).

Chromium also contains `outputSchema` in its
[registration dictionary](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context_tool.idl)
and [registration serialization implementation](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context.cc#454).

Repository implications:

- Make tool property allowlists profile-specific. `src/profiles.ts` currently
  has a shared `TOOL_PROPERTIES` without `outputSchema`; adding it globally
  would silently change historical targets.
- Add `draft-2026-11-02` and a separately pinned current Chromium target.
- Add output schema validation with the same conservative serialization
  boundary as `valid-input-schema`; consider a separate `valid-output-schema`
  rule that shares the validator. Do not require an output schema or infer
  arbitrary callback return values in this update.
- Reuse opt-in JSON Schema 2020-12 validation without fetching remote refs.
  The Web IDL schema object requirement and JSON Schema validation policy
  remain distinct.
- Update the target migration guide, rule tables, property documentation,
  executable examples, and target regression tests.

### 2. Separate current Chromium Tool handles from draft dictionaries

Current Chromium's [ModelContext IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context.idl)
returns `sequence<Tool>` from `getTools()` and accepts a `Tool` in
`executeTool()`. Its [Tool IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/tool.idl)
defines readonly metadata and an internal identifier tied to a registration.
The implementation switched from name-based dictionaries to these handles to
prevent execution of a different registration reusing the same name. The
[landing commit](https://chromium.googlesource.com/chromium/src/+/61931ab5563755f318488eff2e2ab49826106d75)
is dated 2026-10-15.

The corresponding [specification PR #348](https://github.com/webmachinelearning/webmcp/pull/348)
is still open. It calls out additional compatibility differences: omitted
metadata can be `null`, spreading a handle copies no metadata, JSON
serialization produces `{}`, and structured cloning throws. These changes
must not be advertised as already merged into the November draft.

Repository implications:

- Add an execution-tool contract to profiles, such as dictionary versus native
  handle. At the time of this review, the
  [`valid-registered-tool` rule](https://github.com/ntnyq/eslint-plugin-webmcp/blob/f3c4b04b66f2ae23e77f578ce4bb1b5202168420/src/rules/consumer.ts#L11)
  validated required dictionary members for every target.
- For a new Chromium profile, reject definitely constructed ordinary objects
  as execution handles; leave unknown identifiers unknown. Keep direct handles
  from discovery valid. Broader alias/data-flow tracking can be a later change.
- Update diagnostics and migration examples: consumers must retain the original
  discovered handle instead of rebuilding or spreading a metadata dictionary.
- Treat readonly interface attributes separately from nested schema values;
  readonly attributes do not establish that the schema's JSON tree is deeply
  frozen.
- Preserve dictionary behavior for all existing targets and for the current
  merged draft.

### 3. Model experimental Chromium methods explicitly

The same pinned [ModelContext IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context.idl)
contains `resumeTool(token, callback)` behind `WebMCPContinuations` and
`waitForToolsUntil(promise)` behind `WebMCPWaitForToolsUntil`. The
[callback options dictionary](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context_tool.idl)
adds an experimental `invocation`, whose
[interface](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context_tool_invocation.idl)
provides `requestToken()`.

The [runtime feature definitions](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/platform/runtime_enabled_features.json5#7726)
mark these features experimental. The specification's
[waitForToolsUntil / ToolChangeEvent PR #373](https://github.com/webmachinelearning/webmcp/pull/373)
is still open and also proposes `toolsReady` and `ToolChangeEvent.ready`.
Those additional proposal members do not appear in the inspected ModelContext
IDL and must not be inferred to be implemented.

Repository implications:

- Document these as a separate experimental capability or target extension.
  Do not silently enable them in the default draft profile.
- `API_METHODS` in `src/profiles.ts` and `isNativeMethod` in
  `src/analysis/api.ts:244` only recognize three current methods. If the plugin
  claims coverage for these experimental methods, extend receiver binding and
  required-argument checks, not merely a property allowlist.
- Unknown method names currently pass through; this means absence of a
  diagnostic is not a compatibility guarantee. Clarify that rule boundary.

## Keep the current behavior in these areas

- The receiver remains `document.modelContext`; registration lifetime uses
  `AbortSignal`. The merged draft still has `registerTool`, `getTools`, and
  `executeTool`, with the existing `exposedTo`, `fromOrigins`, and `signal`
  options. The callback still receives input plus execution options. See the
  [pinned API](https://github.com/webmachinelearning/webmcp/blob/6cd745ac8a186122bd3f4aeaeb1d6cfa820251d2/index.bs#L717).
- Chrome's imperative guide still documents optional object execution input,
  JSON text deprecation from Chrome 155, and `debugging` from Chrome 156. These
  changes are already covered by the October profiles. See the
  [imperative guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api).
- Do not add `openWorldHint` to the merged draft: its
  [PR #355](https://github.com/webmachinelearning/webmcp/pull/355) remains open,
  including uncertainty about default values. Likewise, do not import MCP's
  entire annotation vocabulary into WebMCP.
- Declarative forms remain a Chromium feature with a separate explainer.
  [Spec PR #338](https://github.com/webmachinelearning/webmcp/pull/338) removed
  the placeholder from the merged specification. The repository's planned
  separate opt-in HTML/JSX/Vue adapters remain appropriate.
- The [Chrome declarative guide](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
  documents `toolname`, `tooldescription`, `toolparamdescription`,
  `toolautosubmit`, `SubmitEvent.agentInvoked`, and `respondWith()` after
  `preventDefault()`. It also documents removal of the old window event
  handlers from Chrome 156. A targeted migration rule for the old receiver
  would be useful, but the current rule intentionally checks ModelContext
  listeners only; this is an existing scope gap, not a November change.
- Current Chromium's Document supplement has only the document receiver; the
  obsolete testing surface should not become a supported standard target
  without a complete historical contract. See the
  [pinned supplement IDL](https://chromium.googlesource.com/chromium/src/+/36c121be58126ddbb0686965897b8c8ff9b246fb/third_party/blink/renderer/core/script_tools/model_context_supplement.idl).

## Local diagnostic probes

The coordinating review ran minimal ESLint `Linter` probes using the source
`createConfig` and current default `draft-2026-10-13`, with both presets.
These observations show the work needed for new targets; they do not claim the
historical profile should accept future APIs.

| Input                                                                                                   | recommended   | strict                     | Implication for new targets                                               |
| ------------------------------------------------------------------------------------------------------- | ------------- | -------------------------- | ------------------------------------------------------------------------- |
| Tool with `outputSchema: { type: 'object' }`                                                            | No diagnostic | Unknown tool property      | New target needs a profile-specific property list                         |
| Tool with `outputSchema: 42`                                                                            | No diagnostic | Unknown tool property only | New target needs output schema validation                                 |
| `executeTool({ name: 'inspect', description: 'Inspect state', window, origin: 'https://example.com' })` | No diagnostic | No diagnostic              | Correct for the dictionary target; not valid for current Chromium handles |
| `waitForToolsUntil()` / `resumeTool()`                                                                  | No diagnostic | No diagnostic              | Experimental method arguments are outside current coverage                |
| `window.addEventListener('toolactivated', onActivate)` / `window.ontoolcancel = onCancel`               | No diagnostic | No diagnostic              | Legacy window event migration is outside current coverage                 |

The high-value first update is new pinned profiles plus output schemas and
Chromium Tool-handle semantics. Experimental continuations/readiness and
declarative adapters should follow as explicitly scoped work.

## Validation

- `pnpm test --run`: 7 test files and 567 tests passed.
- The diagnostic probes above exercised ESLint against the plugin source;
  they did not execute the WebMCP browser API.
- This review adds only this research document; plugin behavior is unchanged.
