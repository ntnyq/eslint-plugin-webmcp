/**
 * API capabilities and accepted dictionary fields for a fixed target.
 */
export interface WebMcpProfile {
  /**
   * Input encoding and presence requirements for executeTool.
   */
  executeInput: 'optional-object' | 'required-json-text'

  /**
   * Representation accepted as the first argument to executeTool.
   */
  executeToolArgument: 'registered-tool' | 'native-tool'

  /**
   * Supported properties of a tool definition.
   */
  toolProperties: readonly string[]

  /**
   * Supported names in a tool’s annotations dictionary.
   */
  annotations: readonly string[]

  /**
   * Event names exposed by ModelContext for this target.
   */
  events: readonly string[]

  /**
   * Whether the target exposes waitForToolsUntil.
   */
  supportsWaitForToolsUntil?: true
}
