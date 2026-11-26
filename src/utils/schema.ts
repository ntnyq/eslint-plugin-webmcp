import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { ANALYSIS_MAX_DEPTH, ANALYSIS_MAX_NODES, PROFILES } from '../constants'
import type {
  AnalysisBudget,
  ObjectFacts,
  SchemaOptions,
  StaticValue,
} from '../types'
import { getDefinitionProperty } from './analysis/api'
import {
  getField,
  isDefinitelyNonCallable,
  readObject,
  readValue,
  resolveExpression,
} from './analysis/static'
import { createApiRule } from './createRule'

/**
 * Find BigInt values that prevent JSON serialization.
 *
 * @param value Statically reconstructed value to inspect.
 * @returns Whether the value or any nested entry is a BigInt.
 */
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

/**
 * Lazily initialized and shared JSON Schema 2020-12 meta-schema validator.
 */
let validator: Ajv2020 | null = null

/**
 * Create or reuse the validator for serialized schemas.
 *
 * @returns The shared Ajv instance configured for schema validation.
 */
function getValidator(): Ajv2020 {
  validator ??= new Ajv2020({
    strict: false,
    allErrors: false,
    validateFormats: false,
  })

  return validator
}

/**
 * Read a schema object whose fields are safe to traverse.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Candidate schema expression.
 * @returns Known object facts when a callable toJSON cannot replace the object.
 */
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
 * Traverse local schema keywords and visit known input parameter definitions.
 *
 * @param source ESLint source that supplies scope information.
 * @param node Schema expression at the current traversal depth.
 * @param visit Callback for each known parameter definition.
 * @param depth Current recursion depth.
 * @param budget Shared allowance for visiting schema nodes.
 * @returns No value. The visitor receives each known parameter definition.
 */
export function visitParameters(
  source: TSESLint.SourceCode,
  node: TSESTree.Node,
  visit: (name: string, schema: TSESTree.Node) => void,
  depth = 0,
  budget?: AnalysisBudget,
): void {
  const remaining = budget ?? { remaining: ANALYSIS_MAX_NODES }

  if (depth > ANALYSIS_MAX_DEPTH || remaining.remaining-- <= 0) {
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
 * Share the serialization and meta-schema contract across optional schema
 * fields.
 *
 * @param property Optional tool schema field to validate.
 * @returns A target-aware schema validation rule.
 */
export function createSchemaRule(property: 'inputSchema' | 'outputSchema') {
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

      const node = getDefinitionProperty(call, property)

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

      if ('$schema' in schema) {
        if (typeof schema.$schema !== 'string') {
          context.report({
            node,
            messageId: 'schema',
            data: { reason: '$schema must be a string' },
          })

          return
        }

        if (
          schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' &&
          schema.$schema !== 'https://json-schema.org/draft/2020-12/schema#'
        ) {
          return
        }
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
