import * as assert from 'assert'
import { keyCounts } from '../../../src/util/key-counts'

describe('util', () => {
  describe('key-counts', () => {
    const testObj = [
      {
        'a': 'b',
        'c': 2,
        'd': {
          'e': { 'f': 0 }
        }
      },
      {
        'a': 'b',
        'd': {
          'e': { 'b': 0 }
        }
      }
    ]
    describe('depth 0', () => {
      it('works properly', () => {
        assert.deepEqual(
          keyCounts(testObj),
          {
            'a': 2,
            'c': 1,
            'd': 2,
          }
        )
      })
    })
    describe('depth 1', () => {
      it('works properly', () => {
        assert.deepEqual(
          keyCounts(testObj, 1),
          {
            'a': 2,
            'c': 1,
            'd': 2,
            'd.e': 2,
          }
        )
      })
    })
    describe('depth 2', () => {
      it('works properly', () => {
        assert.deepEqual(
          keyCounts(testObj, 2),
          {
            'a': 2,
            'c': 1,
            'd': 2,
            'd.e': 2,
            'd.e.f': 1,
            'd.e.b': 1
          }
        )
      })
    })
  })
})
