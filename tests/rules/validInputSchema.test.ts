import { rules } from '../../src/rules'
import { schemaCases } from '../fixtures/schemas'
import { createRuleTester } from '../helpers'

const tester = createRuleTester()

tester.run(
  'valid-input-schema',
  rules['valid-input-schema'],
  schemaCases('inputSchema'),
)
