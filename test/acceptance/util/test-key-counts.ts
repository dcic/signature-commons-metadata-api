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
          'e': { 'b': 0 },
          'g': { 'h': { 'i': 1 } }
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
      it('works properly with values', () => {
        assert.deepEqual(
          keyCounts(testObj, 0, true),
          {
            'a': 2,
            'a:b': 2,
            'c': 1,
            'c:2': 1,
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
      it('works properly with values', () => {
        assert.deepEqual(
          keyCounts(testObj, 1, true),
          {
            'a': 2,
            'a:b': 2,
            'c': 1,
            'c:2': 1,
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
      it('with values works properly', () => {
        assert.deepEqual(
          keyCounts(testObj, 2, true),
          {
            'a': 2,
            'a:b': 2,
            'c': 1,
            'c:2': 1,
            'd': 2,
            'd.e': 2,
            'd.e.f': 1,
            'd.e.f:0': 1,
            'd.g': 1,
            'd.g.h': 1,
            'd.e.b': 1,
            'd.e.b:0': 1
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
      it('with values works properly', () => {
        assert.deepEqual(
          keyCounts(testObj, 3, true),
          {
            'a': 2,
            'a:b': 2,
            'c': 1,
            'c:2': 1,
            'd': 2,
            'd.e': 2,
            'd.e.f': 1,
            'd.e.f:0': 1,
            'd.g': 1,
            'd.g.h': 1,
            'd.e.b': 1,
            'd.e.b:0': 1,
            "d.g.h.i": 1,
            "d.g.h.i:1": 1
          }
        )
      })
    })
  })
})
