import * as assert from 'assert'
import { applyFieldsFilter } from '../../../src/util/applyFieldsFilter'

describe('util', () => {
  describe('applyFieldsFilter', () => {
    describe('deep object', () => {
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

    describe('value array', () => {
      it('works properly', () => {
        assert.deepEqual(
          applyFieldsFilter(
            {
              a: 'b',
              c: [
                'd',
                'e',
                'f',
              ],
            },
            [
              'c',
            ]
          ),
          {
            c: [
              'd',
              'e',
              'f',
            ],
          }
        )
      })
    })

    describe('deep filter value array', () => {
      it('works properly', () => {
        assert.deepEqual(
          applyFieldsFilter(
            {
              a: 'b',
              c: [
                'd',
                'e',
                'f',
              ],
            },
            [
              'c.e',
            ]
          ),
          {
            c: [
              'e',
            ],
          }
        )
      })
    })


    describe('deep array', () => {
      it('works properly', () => {
        assert.deepEqual(
          applyFieldsFilter(
            {
              a: 'b',
              c: [
                {
                  d: 'e'
                },
                {
                  d: 'f',
                  e: 'f',
                },
              ],
            },
            [
              'c.d',
            ]
          ),
          {
            c: [
              {
                d: 'e',
              },
              {
                d: 'f',
              }
            ],
          }
        )
      })
    })
  })
})
