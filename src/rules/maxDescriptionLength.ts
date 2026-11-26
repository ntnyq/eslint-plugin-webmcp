import { DEFAULT_DESCRIPTION_LENGTH_OPTIONS } from '../constants'
import type { DescriptionLengthOptions } from '../types'
import {
  createApiRule,
  isDefinition,
  readObject,
  readString,
  visitParameters,
} from '../utils'

/**
 * Check known tool and parameter descriptions against Unicode code-point
 * budgets.
 */
export const maxDescriptionLength = createApiRule<
  [DescriptionLengthOptions],
  'long'
>({
  name: 'max-description-length',
  description: 'Apply configurable Unicode code-point budgets to descriptions.',
  type: 'suggestion',
  defaultOptions: [{ ...DEFAULT_DESCRIPTION_LENGTH_OPTIONS }],
  schema: [
    {
      type: 'object',
      properties: {
        tool: { type: 'integer', minimum: 1 },
        parameter: { type: 'integer', minimum: 1 },
        unit: {
          type: 'string',
          enum: [DEFAULT_DESCRIPTION_LENGTH_OPTIONS.unit],
        },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    long: 'This description has {{length}} Unicode code points; the configured limit is {{limit}}.',
  },
  check(call, analyzer, context, [options]) {
    if (!isDefinition(call)) {
      return
    }

    /**
     * Report a statically known description that exceeds its limit.
     *
     * @param node Description expression, when present.
     * @param limit Maximum length in Unicode code points.
     * @returns No value. Reports through the rule context.
     */
    const reportDescription = (
      node: Parameters<typeof readString>[1],
      limit: number,
    ) => {
      const description = readString(analyzer.source, node)

      if (
        node &&
        description !== undefined &&
        [...description].length > limit
      ) {
        context.report({
          node,
          messageId: 'long',
          data: { length: [...description].length, limit },
        })
      }
    }

    reportDescription(
      call.tool?.properties.get('description')?.value,
      options.tool ?? DEFAULT_DESCRIPTION_LENGTH_OPTIONS.tool,
    )
    const schema = call.tool?.properties.get('inputSchema')?.value

    if (schema) {
      visitParameters(analyzer.source, schema, (_name, parameter) => {
        reportDescription(
          readObject(analyzer.source, parameter)?.properties.get('description')
            ?.value,
          options.parameter ?? DEFAULT_DESCRIPTION_LENGTH_OPTIONS.parameter,
        )
      })
    }
  },
})
