import parser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import type { WebMcpTarget } from '../src'

export function createRuleTester(target?: WebMcpTarget) {
  return new RuleTester({
    languageOptions: {
      parser,
    },
    ...(target && {
      settings: {
        webmcp: {
          target,
        },
      },
    }),
  })
}

export const registerTool = (properties: string) =>
  `document.modelContext.registerTool({ ${properties} })`

export const registerToolWithOptions = (options: string) =>
  `document.modelContext.registerTool(tool, { ${options} })`

export const registerToolWithAnnotations = (annotations: string) =>
  registerTool(`annotations: ${annotations}`)

export const registerToolWithInputSchema = (schema: string) =>
  `document.modelContext.registerTool({inputSchema: ${schema}})`
