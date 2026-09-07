import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { isDefinition } from '../analysis/api'
import {
  readObject,
  readString,
  readValue,
  resolveExpression,
} from '../analysis/static'
import type { StaticValue } from '../analysis/static'
import { createApiRule } from '../createRule'

type InputSchemaOptions = [
  { mode: 'platform' } | { mode: 'json-schema'; dialect: '2020-12' },
]

function containsBigInt(value: StaticValue): boolean {
  if (typeof value === 'bigint') {
    return true
  }
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).some(entry => containsBigInt(entry))
  )
}

let validator: Ajv2020 | null = null

function getValidator(): Ajv2020 {
  validator ??= new Ajv2020({
    strict: false,
    allErrors: false,
    validateFormats: false,
  })
  return validator
}

/**
 * Visit schema keywords only, never enum/default/example data or remote references.
 *
 * @param source The source containing schema expressions
 * @param node The root schema expression
 * @param visit Called for each known parameter definition
 * @param depth Current recursion depth
 * @param budget Shared remaining node budget
 */
export function visitParameters(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
  visit: (name: string, schema: TSESTree.Node) => void,
  depth = 0,
  budget?: { remaining: number },
): void {
  const remaining = budget ?? { remaining: 1000 }
  if (depth > 20 || remaining.remaining-- <= 0) {
    return
  }
  const object = readObject(source, node)
  if (!object) {
    return
  }
  for (const [key, property] of object.properties) {
    if (
      ['properties', '$defs', 'patternProperties', 'dependentSchemas'].includes(
        key,
      )
    ) {
      for (const [name, child] of readObject(source, property.value)
        ?.properties ?? []) {
        if (key === 'properties') {
          visit(name, child.value)
        }
        visitParameters(source, child.value, visit, depth + 1, remaining)
      }
    } else if (
      [
        'items',
        'additionalProperties',
        'contains',
        'not',
        'if',
        'then',
        'else',
        'propertyNames',
        'unevaluatedProperties',
        'unevaluatedItems',
      ].includes(key)
    ) {
      visitParameters(source, property.value, visit, depth + 1, remaining)
    } else if (['allOf', 'anyOf', 'oneOf', 'prefixItems'].includes(key)) {
      const array = resolveExpression(source, property.value)
      const elements = array.type === 'ArrayExpression' ? array.elements : []
      for (const child of elements) {
        if (child && child.type !== 'SpreadElement') {
          visitParameters(source, child, visit, depth + 1, remaining)
        }
      }
    }
  }
}

export const validInputSchema = createApiRule<
  InputSchemaOptions,
  'object' | 'serialization' | 'schema'
>({
  name: 'valid-input-schema',
  description:
    'Check platform schema boundaries and optionally JSON Schema 2020-12 syntax.',
  recommended: 'error',
  defaultOptions: [{ mode: 'platform' }],
  schema: [
    {
      oneOf: [
        {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['platform'] } },
          required: ['mode'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['json-schema'] },
            dialect: { type: 'string', enum: ['2020-12'] },
          },
          required: ['mode', 'dialect'],
          additionalProperties: false,
        },
      ],
    },
  ],
  messages: {
    object: 'inputSchema must be an object when provided.',
    serialization:
      'inputSchema contains a BigInt and cannot be JSON serialized.',
    schema: 'Invalid JSON Schema 2020-12: {{reason}}.',
  },
  check(call, analyzer, context, [options]) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('inputSchema')?.value
      : undefined
    if (!node) {
      return
    }
    const fact = readValue(analyzer.source, node)
    if (fact.kind !== 'known' || fact.value === undefined) {
      return
    }
    if (fact.value === null || typeof fact.value !== 'object') {
      context.report({ node, messageId: 'object' })
      return
    }
    if (containsBigInt(fact.value)) {
      context.report({ node, messageId: 'serialization' })
      return
    }
    if (options.mode !== 'json-schema') {
      return
    }
    // Validation applies to the JSON representation actually sent to the platform.
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- Validate JSON wire semantics, including omitted undefined fields.
    const schema: unknown = JSON.parse(JSON.stringify(fact.value))
    if (typeof schema !== 'object' || schema === null) {
      return
    }
    if (
      '$schema' in schema &&
      schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' &&
      schema.$schema !== 'https://json-schema.org/draft/2020-12/schema#'
    ) {
      return
    }
    const ajv = getValidator()
    if (!ajv.validateSchema(schema)) {
      context.report({
        node,
        messageId: 'schema',
        data: { reason: ajv.errorsText(ajv.errors) },
      })
    }
  },
})

export const noIncompatibleExecuteArguments = createApiRule({
  name: 'no-incompatible-execute-arguments',
  description:
    'Use the executeTool input representation required by the target.',
  recommended: 'error',
  defaultOptions: [],
  messages: {
    object:
      '{{target}} expects an input object; do not pass JSON text or primitives.',
    text: '{{target}} expects JSON text; explicitly serialize the input object.',
  },
  check(call, analyzer, context) {
    if (
      call.receiver !== 'document' ||
      !call.bound ||
      call.method !== 'executeTool' ||
      call.node.arguments.some(
        (argument, index) => index <= 1 && argument.type === 'SpreadElement',
      )
    ) {
      return
    }
    const [, node] = call.node.arguments
    if (!node) {
      return
    }
    const fact = readValue(analyzer.source, node)
    const expression = resolveExpression(analyzer.source, node)
    if (analyzer.settings.target === 'draft-2026-09-04') {
      if (
        fact.kind === 'known' &&
        fact.value !== undefined &&
        (fact.value === null || typeof fact.value !== 'object')
      ) {
        context.report({
          node,
          messageId: 'object',
          data: { target: analyzer.settings.target },
        })
      }
    } else if (
      expression.type === 'ObjectExpression' ||
      expression.type === 'ArrayExpression'
    ) {
      context.report({
        node,
        messageId: 'text',
        data: { target: analyzer.settings.target },
      })
    }
  },
})

export const preferParameterDescriptions = createApiRule({
  name: 'prefer-parameter-descriptions',
  description: 'Describe statically known input parameters.',
  type: 'suggestion',
  strict: 'warn',
  defaultOptions: [],
  messages: { missing: 'Describe input parameter "{{name}}".' },
  check(call, analyzer, context) {
    const node = isDefinition(call)
      ? call.tool?.properties.get('inputSchema')?.value
      : undefined
    if (!node) {
      return
    }
    visitParameters(analyzer.source, node, (name, schema) => {
      const object = readObject(analyzer.source, schema)
      if (!object || object.properties.has('$ref')) {
        return
      }
      const description = object.properties.get('description')?.value
      const text = readString(analyzer.source, description)
      if (
        (!description && object.complete) ||
        (text !== undefined && text.trim().length === 0)
      ) {
        context.report({
          node: description ?? schema,
          messageId: 'missing',
          data: { name },
        })
      }
    })
  },
})
