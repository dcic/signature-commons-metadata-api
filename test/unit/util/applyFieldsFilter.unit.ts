import * as assert from 'assert'
import { applyFieldsFilter } from '../../../src/util/applyFieldsFilter'

describe('util', () => {
  describe('applyFieldsFilter', () => {
    it('works properly', () => {
      assert.deepEqual(
        applyFieldsFilter(
          {
            a: 'b',
            c: {
              d: {
                e: 'f',
                j: 'k',
                l: 'm',
              },
              n: {
                o: 'p',
              },
              q: {
                r: 's'
              }
            }
          },
          [
            'c.d.e',
            'c.d.j',
            'c.n',
          ]
        ),
        {
          c: {
            d: {
              e: 'f',
              j: 'k',
            },
            n: {
              o: 'p',
            },
          }
        }
      )
    })
  })
})
