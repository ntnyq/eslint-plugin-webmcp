import { isDefinition } from '../analysis/api'
import { getField, readObject, readString, readValue } from '../analysis/static'
import { createApiRule, stringListOption } from '../createRule'
import { ANNOTATIONS, PROFILES } from '../profiles'
import { isValidToolName } from './core'
import { visitParameters } from './schema'

export const preferToolTitle = createApiRule({
  name: 'prefer-tool-title',
  description: 'Opt into human-readable tool titles.',
  type: 'suggestion',
  defaultOptions: [],
  messages: { title: 'Provide a human-readable title for this tool.' },
  check(call, analyzer, context) {
    if (!isDefinition(call) || !call.toolNode) {
      return
    }
    const title = getField(call.tool, 'title')
    const value =
      title.kind === 'known'
        ? readValue(analyzer.source, title.node)
        : undefined
    if (
      title.kind === 'missing' ||
      (value?.kind === 'known' &&
        (value.value === undefined ||
          (typeof value.value === 'string' && value.value.trim().length === 0)))
    ) {
      context.report({
        node: title.kind === 'known' ? title.node : call.toolNode,
        messageId: 'title',
      })
    }
  },
})

export const noPlaceholderDescription = createApiRule({
  name: 'no-placeholder-description',
  description: 'Replace complete placeholder descriptions with useful text.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [{ placeholders: ['TODO', 'TBD', 'FIXME'] }],
  schema: stringListOption('placeholders'),
  messages: {
    placeholder:
      'Replace the placeholder description "{{description}}" with the tool’s purpose.',
  },
  check(call, analyzer, context, [options]) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('description')?.value
      : undefined
    const description = readString(analyzer.source, node)
    if (
      node &&
      description &&
      options.placeholders.some(
        placeholder =>
          placeholder.trim().toLowerCase() === description.trim().toLowerCase(),
      )
    ) {
      context.report({ node, messageId: 'placeholder', data: { description } })
    }
  },
})

export interface DescriptionLengthOptions {
  tool?: number
  parameter?: number
  unit?: 'codePoint'
}

export const maxDescriptionLength = createApiRule<
  [DescriptionLengthOptions],
  'long'
>({
  name: 'max-description-length',
  description: 'Apply configurable Unicode code-point budgets to descriptions.',
  type: 'suggestion',
  defaultOptions: [{ tool: 500, parameter: 150, unit: 'codePoint' as const }],
  schema: [
    {
      type: 'object',
      properties: {
        tool: { type: 'integer', minimum: 1 },
        parameter: { type: 'integer', minimum: 1 },
        unit: { type: 'string', enum: ['codePoint'] },
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
      options.tool ?? 500,
    )
    const schema = call.tool?.properties.get('inputSchema')?.value
    if (schema) {
      visitParameters(analyzer.source, schema, (_name, parameter) => {
        reportDescription(
          readObject(analyzer.source, parameter)?.properties.get('description')
            ?.value,
          options.parameter ?? 150,
        )
      })
    }
  },
})

type NameStyle = 'snake_case' | 'kebab-case' | 'camelCase'
export interface NameOptions {
  style?: NameStyle | 'dot-separated'
  segmentStyle?: NameStyle
  prefix?: string
}

const NAME_PATTERNS: Record<NameStyle, RegExp> = {
  snake_case: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u,
  'kebab-case': /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u,
  camelCase: /^[a-z][a-zA-Z0-9]*$/u,
}

export const toolNameConvention = createApiRule<[NameOptions], 'convention'>({
  name: 'tool-name-convention',
  description:
    'Apply a project-specific naming convention to valid tool names.',
  type: 'suggestion',
  defaultOptions: [
    { style: 'snake_case', segmentStyle: 'kebab-case', prefix: '' },
  ],
  schema: [
    {
      type: 'object',
      properties: {
        style: {
          type: 'string',
          enum: ['snake_case', 'kebab-case', 'camelCase', 'dot-separated'],
        },
        segmentStyle: {
          type: 'string',
          enum: ['snake_case', 'kebab-case', 'camelCase'],
        },
        prefix: { type: 'string' },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    convention:
      'Tool name "{{name}}" does not follow the configured {{style}} style and prefix "{{prefix}}".',
  },
  check(call, analyzer, context, [options]) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('name')?.value
      : undefined
    const name = readString(analyzer.source, node)
    if (!node || name === undefined || !isValidToolName(name)) {
      return
    }
    const {
      style = 'snake_case',
      segmentStyle = 'kebab-case',
      prefix = '',
    } = options
    const suffix = name.slice(prefix.length)
    const matchesStyle =
      style === 'dot-separated'
        ? suffix
            .split('.')
            .every(segment => NAME_PATTERNS[segmentStyle].test(segment))
        : NAME_PATTERNS[style].test(suffix)
    if (!name.startsWith(prefix) || !matchesStyle) {
      context.report({
        node,
        messageId: 'convention',
        data: { name, style, prefix },
      })
    }
  },
})

export const requireExplicitAnnotations = createApiRule({
  name: 'require-explicit-annotations',
  description: 'Require explicit evaluation of configured tool hints.',
  type: 'suggestion',
  defaultOptions: [{ fields: ['readOnlyHint', 'consequentialHint'] }],
  schema: [
    {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string', enum: ANNOTATIONS },
          minItems: 1,
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    missing: 'Explicitly evaluate the "{{name}}" annotation for this tool.',
  },
  check(call, analyzer, context, [options]) {
    if (!isDefinition(call) || !call.toolNode) {
      return
    }
    const field = getField(call.tool, 'annotations')
    const object =
      field.kind === 'known'
        ? readObject(analyzer.source, field.node)
        : undefined
    const value =
      field.kind === 'known'
        ? readValue(analyzer.source, field.node)
        : undefined
    const fields = options.fields.filter(name =>
      PROFILES[analyzer.settings.target].annotations.includes(name),
    )
    for (const name of fields) {
      const annotation = getField(object, name)
      const hint =
        annotation.kind === 'known'
          ? readValue(analyzer.source, annotation.node)
          : undefined
      if (
        field.kind === 'missing' ||
        (value?.kind === 'known' &&
          (value.value === null || value.value === undefined)) ||
        annotation.kind === 'missing' ||
        (hint?.kind === 'known' && hint.value === undefined)
      ) {
        context.report({
          node: field.kind === 'known' ? field.node : call.toolNode,
          messageId: 'missing',
          data: { name },
        })
      }
    }
  },
})
