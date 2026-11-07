import {
  noPreabortedRegistrationSignal,
  noUnknownApiOptions,
  preferCanonicalOrigin,
  requireApiArguments,
  validAbortSignal,
  validOriginList,
} from './apiOptions'
import {
  noIncompatibleExecuteArguments,
  noUnknownModelContextEvents,
  validRegisteredTool,
} from './consumer'
import {
  noEmptyDescription,
  noUnboundApiCall,
  noUnsupportedApi,
  requireToolProperties,
  validExecute,
  validToolName,
} from './core'
import { noUnknownToolProperties, validAnnotations } from './metadata'
import {
  maxDescriptionLength,
  noPlaceholderDescription,
  preferToolTitle,
  requireExplicitAnnotations,
  toolNameConvention,
} from './quality'
import {
  preferParameterDescriptions,
  validInputSchema,
  validOutputSchema,
} from './schema'

export const rules = {
  'require-tool-properties': requireToolProperties,
  'valid-tool-name': validToolName,
  'valid-execute': validExecute,
  'no-empty-description': noEmptyDescription,
  'no-unsupported-api': noUnsupportedApi,
  'no-unbound-api-call': noUnboundApiCall,
  'valid-input-schema': validInputSchema,
  'valid-output-schema': validOutputSchema,
  'no-incompatible-execute-arguments': noIncompatibleExecuteArguments,
  'prefer-parameter-descriptions': preferParameterDescriptions,
  'no-unknown-tool-properties': noUnknownToolProperties,
  'valid-annotations': validAnnotations,
  'require-api-arguments': requireApiArguments,
  'no-unknown-api-options': noUnknownApiOptions,
  'valid-abort-signal': validAbortSignal,
  'valid-origin-list': validOriginList,
  'prefer-canonical-origin': preferCanonicalOrigin,
  'no-preaborted-registration-signal': noPreabortedRegistrationSignal,
  'valid-registered-tool': validRegisteredTool,
  'no-unknown-model-context-events': noUnknownModelContextEvents,
  'prefer-tool-title': preferToolTitle,
  'max-description-length': maxDescriptionLength,
  'no-placeholder-description': noPlaceholderDescription,
  'tool-name-convention': toolNameConvention,
  'require-explicit-annotations': requireExplicitAnnotations,
}
