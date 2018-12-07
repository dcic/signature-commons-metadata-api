import * as assert from 'assert'
import { keyCounts, valueCounts } from '../../../src/util/key-counts'

describe('util', () => {
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
        'e': { 'b': 0 },
        'g': { 'h': { 'i': 1 } }
      }
    }
  ]
  describe('key-counts', () => {
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
            'd.g': 1,
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
            'd.g': 1,
            'd.e.f': 1,
            'd.e.b': 1,
            'd.g.h': 1
          }
        )
      })
    })
    describe('depth 3', () => {
      it('works properly', () => {
        assert.deepEqual(
          keyCounts(testObj, 3),
          {
            'a': 2,
            'c': 1,
            'd': 2,
            'd.e': 2,
            'd.g': 1,
            'd.e.f': 1,
            'd.e.b': 1,
            'd.g.h': 1,
            "d.g.h.i": 1,
          }
        )
      })
    })
    describe('lists', () => {
      it('works properly', () => {
        assert.deepEqual(
          keyCounts([{
            'a': [
              {
                'b': 'c'
              },
              {
                'd': 'e'
              },
            ]
          }], 2),
          {
            'a': 3,
            'a.b': 1,
            'a.d': 1,
          }
        )
      })
    })
  })
  describe('value-counts', () => {
    describe('depth 0', () => {
      it('works properly', () => {
        assert.deepEqual(
          valueCounts(testObj, 0),
          {
            'a': {
              'b': 2,
            },
            'c': {
              '2': 1,
            },
            'd': {
              '[object]': 2,
            },
          }
        )
      })
    })
    describe('depth 1', () => {
      it('works properly with values', () => {
        assert.deepEqual(
          valueCounts(testObj, 1),
          {
            'a': {
              'b': 2,
            },
            'c': {
              '2': 1,
            },
            'd': {
              '[object]': 2,
            },
            'd.e': {
              '[object]': 2,
            },
            'd.g': {
              '[object]': 1,
            },
          }
        )
      })
    })
    describe('depth 2', () => {
      it('with values works properly', () => {
        assert.deepEqual(
          valueCounts(testObj, 2),
          {
            'a': {
              'b': 2,
            },
            'c': {
              '2': 1,
            },
            'd': {
              '[object]': 2
            },
            'd.e': {
              '[object]': 2
            },
            'd.e.b': {
              '0': 1
            },
            'd.e.f': {
              '0': 1
            },
            'd.g': {
              '[object]': 1
            },
            'd.g.h': {
              '[object]': 1
            },
          }
        )
      })
    })
    describe('depth 3', () => {
      it('with values works properly', () => {
        assert.deepEqual(
          valueCounts(testObj, 3),
          {
            "a": {
              "b": 2
            },
            "c": {
              "2": 1
            },
            "d": {
              "[object]": 2
            },
            "d.e": {
              "[object]": 2
            },
            "d.e.b": {
              "0": 1
            },
            "d.e.f": {
              "0": 1
            },
            "d.g": {
              "[object]": 1
            },
            "d.g.h": {
              "[object]": 1
            },
            "d.g.h.i": {
              "1": 1
            },
          }
        )
      })
      describe('lists', () => {
        it('works properly', () => {
          assert.deepEqual(
            valueCounts([{
              'a': [
                {
                  'b': 'c'
                },
                {
                  'd': 'e'
                },
              ]
            }], 2),
            {
              'a': {
                '[array]': 1,
                '[object]': 2,
              },
              'a.b': {
                'c': 1,
              },
              'a.d': {
                'e': 1,
              },
            }
          )
        })
      })
    })
  })
})
