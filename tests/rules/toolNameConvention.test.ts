import { rules } from '../../src/rules'
import { createRuleTester, registerTool } from '../helpers'

const tester = createRuleTester()

tester.run('tool-name-convention', rules['tool-name-convention'], {
  valid: [
    registerTool('name: "search_products"'),
    registerTool('name: "invalid name"'),
    {
      code: registerTool('name: "search-products"'),
      options: [{ style: 'kebab-case' }],
    },
    {
      code: registerTool('name: "searchProducts"'),
      options: [{ style: 'camelCase' }],
    },
    {
      code: registerTool('name: "catalog.search-products"'),
      options: [
        {
          style: 'dot-separated',
          segmentStyle: 'kebab-case',
          prefix: 'catalog.',
        },
      ],
    },
    {
      code: registerTool('name: "catalog.search_products"'),
      options: [{ style: 'dot-separated', segmentStyle: 'snake_case' }],
    },
  ],
  invalid: [
    {
      code: registerTool('name: "SearchProducts"'),
      errors: [{ messageId: 'convention' }],
    },
    {
      code: registerTool('name: "search-products"'),
      errors: [{ messageId: 'convention' }],
    },
    {
      code: registerTool('name: "other.search"'),
      options: [{ style: 'dot-separated', prefix: 'catalog.' }],
      errors: [{ messageId: 'convention' }],
    },
    {
      code: registerTool('name: "catalog..search"'),
      options: [{ style: 'dot-separated' }],
      errors: [{ messageId: 'convention' }],
    },
  ],
})
