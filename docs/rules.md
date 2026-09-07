# Rules

24 implemented rules. `strict` includes all recommended rules. A dash means disabled by that preset.

| Rule                                                                            | Recommended | Strict | Purpose                                                                     |
| ------------------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------- |
| [require-tool-properties](rules/require-tool-properties.md)                     | error       | error  | Require the mandatory tool definition fields.                               |
| [valid-tool-name](rules/valid-tool-name.md)                                     | error       | error  | Validate static tool names against the target API.                          |
| [valid-execute](rules/valid-execute.md)                                         | error       | error  | Reject definitely non-callable execute values.                              |
| [no-empty-description](rules/no-empty-description.md)                           | warn        | warn   | Require nonempty, non-whitespace tool descriptions.                         |
| [no-unsupported-api](rules/no-unsupported-api.md)                               | error       | error  | Report legacy WebMCP entry points and removed methods.                      |
| [no-unbound-api-call](rules/no-unbound-api-call.md)                             | error       | error  | Keep the native ModelContext receiver when calling its methods.             |
| [valid-input-schema](rules/valid-input-schema.md)                               | error       | error  | Check platform schema boundaries and optionally JSON Schema 2020-12 syntax. |
| [no-incompatible-execute-arguments](rules/no-incompatible-execute-arguments.md) | error       | error  | Use the executeTool input representation required by the target.            |
| [prefer-parameter-descriptions](rules/prefer-parameter-descriptions.md)         | —           | warn   | Describe statically known input parameters.                                 |
| [no-unknown-tool-properties](rules/no-unknown-tool-properties.md)               | —           | warn   | Catch unrecognized tool definition properties.                              |
| [valid-annotations](rules/valid-annotations.md)                                 | —           | warn   | Use supported hint names and explicit boolean values.                       |
| [require-api-arguments](rules/require-api-arguments.md)                         | error       | error  | Require mandatory WebMCP call arguments.                                    |
| [no-unknown-api-options](rules/no-unknown-api-options.md)                       | —           | warn   | Catch unrecognized or misplaced API options.                                |
| [valid-abort-signal](rules/valid-abort-signal.md)                               | error       | error  | Reject values that are definitely not AbortSignals.                         |
| [valid-origin-list](rules/valid-origin-list.md)                                 | error       | error  | Validate known origin lists and absolute URL strings.                       |
| [prefer-canonical-origin](rules/prefer-canonical-origin.md)                     | —           | warn   | Make origin-wide exposure explicit in URL options.                          |
| [no-preaborted-registration-signal](rules/no-preaborted-registration-signal.md) | —           | warn   | Avoid registering with an already-aborted signal.                           |
| [valid-registered-tool](rules/valid-registered-tool.md)                         | error       | error  | Validate statically known RegisteredTool dictionaries.                      |
| [no-unknown-model-context-events](rules/no-unknown-model-context-events.md)     | —           | warn   | Catch unrecognized native ModelContext event names.                         |
| [prefer-tool-title](rules/prefer-tool-title.md)                                 | —           | —      | Opt into human-readable tool titles.                                        |
| [max-description-length](rules/max-description-length.md)                       | —           | —      | Apply configurable Unicode code-point budgets to descriptions.              |
| [no-placeholder-description](rules/no-placeholder-description.md)               | —           | warn   | Replace complete placeholder descriptions with useful text.                 |
| [tool-name-convention](rules/tool-name-convention.md)                           | —           | —      | Apply a project-specific naming convention to valid tool names.             |
| [require-explicit-annotations](rules/require-explicit-annotations.md)           | —           | —      | Require explicit evaluation of configured tool hints.                       |
