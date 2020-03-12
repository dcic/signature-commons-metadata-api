import * as assert from 'assert';
import {ObjectItems} from '../../../src/util/object-items';

describe('util', () => {
  describe('object-items', () => {
    it('works properly', () => {
      assert.deepEqual(
        ObjectItems({
          a: 'b',
          c: 2,
          d: {
            e: 'f',
          },
        }),
        [
          ['a', 'b'],
          ['c', 2],
          ['d', {e: 'f'}],
        ],
      );
    });
  });
});
