import { maxDescriptionLength } from './maxDescriptionLength'
import { noEmptyDescription } from './noEmptyDescription'
import { noIncompatibleExecuteArguments } from './noIncompatibleExecuteArguments'
import { noPlaceholderDescription } from './noPlaceholderDescription'
import { noPreabortedRegistrationSignal } from './noPreabortedRegistrationSignal'
import { noUnboundApiCall } from './noUnboundApiCall'
import { noUnknownApiOptions } from './noUnknownApiOptions'
import { noUnknownModelContextEvents } from './noUnknownModelContextEvents'
import { noUnknownToolProperties } from './noUnknownToolProperties'
import { noUnsupportedApi } from './noUnsupportedApi'
import { preferCanonicalOrigin } from './preferCanonicalOrigin'
import { preferParameterDescriptions } from './preferParameterDescriptions'
import { preferToolTitle } from './preferToolTitle'
import { requireApiArguments } from './requireApiArguments'
import { requireExplicitAnnotations } from './requireExplicitAnnotations'
import { requireToolProperties } from './requireToolProperties'
import { toolNameConvention } from './toolNameConvention'
import { validAbortSignal } from './validAbortSignal'
import { validAnnotations } from './validAnnotations'
import { validExecute } from './validExecute'
import { validInputSchema } from './validInputSchema'
import { validOriginList } from './validOriginList'
import { validOutputSchema } from './validOutputSchema'
import { validRegisteredTool } from './validRegisteredTool'
import { validToolName } from './validToolName'

/**
 * Registry of all plugin rules keyed by their unprefixed ESLint rule IDs.
 */
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
