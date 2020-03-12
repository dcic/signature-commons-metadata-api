import * as assert from 'assert';
import {makeTemplate} from '../../../src/util/dynamic-template';

describe('util', () => {
  describe('dynamic-template', () => {
    describe('makeTemplate', () => {
      it('works with no args', () => {
        assert.equal(
          makeTemplate('hello test', {me: 'test', you: 'no'}),
          'hello test',
        );
      });
      it('works', () => {
        assert.equal(makeTemplate('hello ${me}', {me: 'test'}), 'hello test');
      });
      it('works with too many args', () => {
        assert.equal(
          makeTemplate('hello ${me}', {me: 'test', you: 'no'}),
          'hello test',
        );
      });
    });
  });
});
