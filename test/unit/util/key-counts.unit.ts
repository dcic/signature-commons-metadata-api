import * as assert from 'assert';
import {keyCounts, valueCounts} from '../../../src/util/key-counts';

describe('util', () => {
  const testObj = [
    {
      a: 'b',
      c: 2,
      d: {
        e: {f: 0},
      },
    },
    {
      a: 'b',
      d: {
        e: {b: 0},
        g: {h: {i: 1}},
      },
    },
  ];
  describe('depth 0', () => {
    it('key-counts', () => {
      assert.deepEqual(keyCounts(testObj, 0), {
        a: 2,
        c: 1,
        d: 2,
      });
    });
    it('value-counts', () => {
      assert.deepEqual(valueCounts(testObj, 0), {
        a: {
          b: 2,
        },
        c: {
          '2': 1,
        },
        d: {
          '[object]': 2,
        },
      });
    });
  });
  describe('depth 1', () => {
    it('key-counts', () => {
      assert.deepEqual(keyCounts(testObj, 1), {
        a: 2,
        c: 1,
        d: 2,
        'd.e': 2,
        'd.g': 1,
      });
    });
    it('value-counts', () => {
      assert.deepEqual(valueCounts(testObj, 1), {
        a: {
          b: 2,
        },
        c: {
          '2': 1,
        },
        d: {
          '[object]': 2,
        },
        'd.e': {
          '[object]': 2,
        },
        'd.g': {
          '[object]': 1,
        },
      });
    });
  });
  describe('depth 2', () => {
    it('key-counts', () => {
      assert.deepEqual(keyCounts(testObj, 2), {
        a: 2,
        c: 1,
        d: 2,
        'd.e': 2,
        'd.g': 1,
        'd.e.f': 1,
        'd.e.b': 1,
        'd.g.h': 1,
      });
    });
    it('value-counts', () => {
      assert.deepEqual(valueCounts(testObj, 2), {
        a: {
          b: 2,
        },
        c: {
          '2': 1,
        },
        d: {
          '[object]': 2,
        },
        'd.e': {
          '[object]': 2,
        },
        'd.e.b': {
          '0': 1,
        },
        'd.e.f': {
          '0': 1,
        },
        'd.g': {
          '[object]': 1,
        },
        'd.g.h': {
          '[object]': 1,
        },
      });
    });
  });
  describe('depth 3', () => {
    it('key-counts', () => {
      assert.deepEqual(keyCounts(testObj, 3), {
        a: 2,
        c: 1,
        d: 2,
        'd.e': 2,
        'd.g': 1,
        'd.e.f': 1,
        'd.e.b': 1,
        'd.g.h': 1,
        'd.g.h.i': 1,
      });
    });
    it('value-counts', () => {
      assert.deepEqual(valueCounts(testObj, 3), {
        a: {
          b: 2,
        },
        c: {
          '2': 1,
        },
        d: {
          '[object]': 2,
        },
        'd.e': {
          '[object]': 2,
        },
        'd.e.b': {
          '0': 1,
        },
        'd.e.f': {
          '0': 1,
        },
        'd.g': {
          '[object]': 1,
        },
        'd.g.h': {
          '[object]': 1,
        },
        'd.g.h.i': {
          '1': 1,
        },
      });
    });
  });

  describe('lists', () => {
    const testObj2 = [
      {
        a: [
          {
            b: {
              d: 'e',
            },
          },
          {
            d: 'e',
          },
        ],
      },
      {
        a: [
          {
            b: {
              d: 'c',
            },
          },
          {
            d: 'e',
          },
        ],
      },
    ];
    describe('depth 1', () => {
      it('key-counts', () => {
        assert.deepEqual(keyCounts(testObj2, 1), {
          a: 6,
          'a.b': 2,
          'a.d': 2,
        });
      });
      it('value-counts', () => {
        assert.deepEqual(valueCounts(testObj2, 1), {
          a: {
            '[array]': 2,
            '[object]': 4,
          },
          'a.b': {
            '[object]': 2,
          },
          'a.d': {
            e: 2,
          },
        });
      });
    });

    describe('depth 2', () => {
      it('key-counts', () => {
        assert.deepEqual(keyCounts(testObj2, 2), {
          a: 6,
          'a.b': 2,
          'a.b.d': 2,
          'a.d': 2,
        });
      });
      it('value-counts', () => {
        assert.deepEqual(valueCounts(testObj2, 2), {
          a: {
            '[array]': 2,
            '[object]': 4,
          },
          'a.b': {
            '[object]': 2,
          },
          'a.b.d': {
            c: 1,
            e: 1,
          },
          'a.d': {
            e: 2,
          },
        });
      });
    });
  });
});
