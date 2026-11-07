import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { isDefinition } from '../analysis/api'
import {
  getField,
  isDefinitelyNonCallable,
  readObject,
  readString,
  readValue,
  resolveExpression,
} from '../analysis/static'
import type { ObjectFacts, StaticValue } from '../analysis/static'
import { createApiRule } from '../createRule'
import { PROFILES } from '../profiles'

type SchemaOptions = [
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

function readSchemaObject(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
): ObjectFacts | undefined {
  const object = readObject(source, node)
  const serializer = getField(object, 'toJSON')
  // Unknown spreads can supply a serializer that replaces this entire branch.
  if (
    serializer.kind === 'missing' ||
    (serializer.kind === 'known' &&
      isDefinitelyNonCallable(source, serializer.node))
  ) {
    return object
  }
  return undefined
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
  const object = readSchemaObject(source, node)
  if (!object) {
    return
  }
  for (const [key, property] of object.properties) {
    if (
      ['properties', '$defs', 'patternProperties', 'dependentSchemas'].includes(
        key,
      )
    ) {
      for (const [name, child] of readSchemaObject(source, property.value)
        ?.properties ?? []) {
        if (key === 'properties' && readSchemaObject(source, child.value)) {
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

/**
 * Share the serialization and meta-schema contract across optional schema fields.
 *
 * @param property The optional tool schema field to validate
 * @returns A target-aware schema validation rule
 */
function createSchemaRule(property: 'inputSchema' | 'outputSchema') {
  return createApiRule<SchemaOptions, 'object' | 'serialization' | 'schema'>({
    name:
      property === 'inputSchema' ? 'valid-input-schema' : 'valid-output-schema',
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
      object: `${property} must be an object when provided.`,
      serialization: `${property} contains a BigInt and cannot be JSON serialized.`,
      schema: 'Invalid JSON Schema 2020-12: {{reason}}.',
    },
    check(call, analyzer, context, [options]) {
      if (
        !PROFILES[analyzer.settings.target].toolProperties.includes(property)
      ) {
        return
      }
      const node = isDefinition(call)
        ? call.tool?.properties.get(property)?.value
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
}

export const validInputSchema = createSchemaRule('inputSchema')
export const validOutputSchema = createSchemaRule('outputSchema')

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
      if (
        !object ||
        object.properties.has('$ref') ||
        object.properties.has('$dynamicRef')
      ) {
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
