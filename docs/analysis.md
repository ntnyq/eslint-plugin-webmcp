# Static analysis contract

The shared analyzer identifies API calls before any rule inspects fields. An arbitrary `server.registerTool()` method is outside the plugin's scope. A local `document`, `window`, `globalThis`, `navigator`, `AbortController` or `AbortSignal` binding overrides its global name.

## Supported syntax

- Direct document receivers and static computed member names.
- Optional chaining, non-null assertions, `as`, angle-bracket assertions and `satisfies` wrappers.
- Same-execution-scope const receiver aliases with no mutation or escape. Property writes invalidate these aliases, including destructuring assignments, loop assignment targets and TypeScript-wrapped targets; ordinary member reads do not.
- Const tool/schema/value aliases with no reassignment; object aliases require a single read, no exports and no cross-function access.
- Static strings, substitution-free templates, literals, arrays, object literals and simple numeric unary expressions. Arbitrary expressions and calls remain unknown.
- Known object spreads and last-property-wins behavior. Unknown spreads/computed keys invalidate fields before them. Explicit properties after them remain known; absent fields remain unknown.
- Direct, const-extracted, destructured and sequence-extracted API methods for the unbound-call rule. Explicit `call`, `apply` and `bind` forms are not treated as unbound calls; tool definitions passed through those forms are currently skipped.
- `waitForToolsUntil()` is recognized for `draft-2026-11-24` and `chrome-2026-11-26`. Analysis checks argument presence and the receiver. Promise settlement and browser readiness are handled at runtime.
- Named import wrappers identified by the configured source module and imported name.

## Conservative skips

Getters, setters and `__proto__` keys can change dictionary conversion behavior and cause the containing object to be skipped. Imported data, shared mutable objects, closures, runtime factories, custom class instances and dynamic keys are not evaluated. Invalid or unresolved facts never become missing properties.

Object facts distinguish a known node, a provably absent field, and an unknown field. Statically known `undefined` remains distinct from unknown; required dictionary members set to `undefined` are reported. Duplicate explicit properties use the last value.

Required tool dictionary checks also recognize array literals and safe const array aliases as missing named required members, regardless of their elements. This does not change the platform schema rules, where arrays remain objects. Mutable, shared and escaped aliases retain the usual conservative skips.

Platform globals are assumed not to be monkey-patched or affected by prototype pollution. The analyzer does not prove effects of external code. Conservative alias restrictions may intentionally skip correct or incorrect code that a fuller data-flow analysis could understand.

## Schema checks

The input and output schema rules share the same validator. Output schemas are checked only by November targets and remain optional. Callback results are not inferred or checked against them. Platform mode checks fully statically readable values: a provided primitive/null schema is invalid, and BigInt within a serializable static object causes JSON serialization failure. `undefined` is treated as omission. Dynamic subtrees, cycles, accessors, functions and `toJSON` methods are not executed or fully modeled; unknown schemas are skipped. Arrays are objects at the platform layer.

JSON Schema mode additionally validates the actual JSON representation with Ajv's 2020-12 meta-schema. There is no compilation of user schemas, remote `$ref` resolution, user format execution, input validation or claim that every contradictory schema is detected. Other declared dialects are skipped; formats and custom keywords are not rejected. Parameter-description traversal visits schema keywords only, not data inside defaults, examples or enums. Schema branches and property maps with a potentially callable `toJSON` are skipped, including unknown spreads that could supply it. A provably non-callable `toJSON` does not block traversal. Unaffected sibling branches remain analyzable. Parameter definitions using `$ref` or `$dynamicRef` are not assumed to lack descriptions.

## Consumer tool arguments

September and October targets and `draft-2026-11-02` inspect `RegisteredTool` dictionaries. The other November targets require the native `Tool` interface. Literals and object copies are rejected even when their dictionary fields cannot be read. No accessor or spread is executed to reach this conclusion. Safe const aliases and TypeScript wrappers are resolved using the same ownership limits as other values. Unresolved handles and arbitrary calls remain unknown; discovery provenance, native branding of unknown objects, metadata use and handle freshness are not analyzed.

## Performance and safety

Analysis is cached per SourceCode, target, wrapper configuration and call node using weak maps. Traversals have depth, property-count and value-node limits; over-budget analysis becomes unknown. No cross-file registry or mutable global tool-name set is used. A file's diagnostics do not depend on the order of prior linted files.

The plugin does not execute tool callbacks, imported modules, factories or getters; open network connections; rename tools; invent descriptions; change origins; or infer security from annotations. It performs no automatic fixes or suggestions with edits.
