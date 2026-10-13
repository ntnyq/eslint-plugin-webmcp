# Implementation scope and remaining design

The design task proposed 46 candidate rules, grouped into phased implementation. This first usable release implements **24 imperative, schema, API-option and metadata rules** with fixed draft/Chrome profiles, conservative static analysis, import-bound definition wrappers, Flat Config presets, documentation and package integration checks.

The remaining 22 design candidates are not exported and are not silently enabled by any preset:

| Area                            | Deferred rules                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature detection and lifecycle | `prefer-feature-detection`, `no-duplicate-registration`, `prefer-registration-signal`, `prefer-execution-signal`                                                                                                    |
| Cross-domain semantic checks    | `no-schema-execute-mismatch`, `no-readonly-write`                                                                                                                                                                   |
| Discovery data flow             | `no-incompatible-tool-schema-use`, `no-mutating-discovered-tool`                                                                                                                                                    |
| Schema quality                  | `no-contradictory-schema-constraints`, `valid-schema-examples`, `require-input-bounds`                                                                                                                              |
| Declarative structure           | `declarative-valid-tool`, `declarative-valid-attribute-placement`, `declarative-control-name`, `declarative-valid-parameter-shape`, `declarative-valid-toolautosubmit`                                              |
| Declarative submission          | `declarative-require-agent-guard`, `declarative-require-prevent-default`, `declarative-no-late-respond-with`, `declarative-no-native-submit`, `declarative-no-unknown-tool-attributes`, `declarative-no-autosubmit` |

Before adding declarative rules, implement and verify separate HTML, JSX and Vue adapters against a dated Chrome implementation, with a separate opt-in configuration. The draft removed its declarative API placeholder on 2026-10-08 ([upstream PR #338](https://github.com/webmachinelearning/webmcp/pull/338)); Chrome still documents the feature. Declarative rules must not be presented as a shared draft requirement. Before adding type-based rules, define an explicit type-checked preset and require parser services. Before adding lifecycle or discovery rules, establish conservative ownership, mutation, branch and asynchronous-control-flow analysis.

Future improvements to existing rules can include safely analyzing shared immutable definitions, bound registration calls, signal cancellation in straight-line code and additional wrapper import forms. These must add false-positive regression tests before broadening the default presets.
