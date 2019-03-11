import * as assert from 'assert'
import { flatten_keys } from '../../../src/util/flatten-keys'

describe('util', () => {
  describe('flatten_keys', () => {
    it('works', () => {
      assert.deepEqual(
        flatten_keys({
          id: '1',
          meta: {
            test: {
              me: ['plenty', 'always'],
              and: 2
            },
            best: {
              nest: {
                guest: '3'
              }
            }
          }
        }),
        {
          id: '1',
          'meta.test.me': ['plenty', 'always'],
          'meta.test.and': 2,
          'meta.best.nest.guest': '3'
        }
      )
    })
  })
})
