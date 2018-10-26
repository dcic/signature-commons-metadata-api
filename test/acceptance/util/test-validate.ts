import * as assert from 'assert'
import { validate } from '../../../src/util/validate'
import { AsyncArrayFromAsyncIterable } from '../../../src/util/async-iterable'

describe('util', () => {
  describe('validate', () => {
    describe('validates correctly', () => {
      it('simple', async () => {
        assert.deepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/meta.json',
            })
          ),
          []
        )
      })
      it('library one-level', async () => {
        assert.deepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/library.json',
              'id': 'test-id',
              'meta': {
                '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/meta.json',
              },
            })
          ),
          []
        )
      })
      it('entity-deep', async () => {
        assert.deepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/entity.json',
              'id': 'test-id',
              'meta': {
                '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/meta/entity/draft-1.json',
                'aliases': ['a', 'b'],
              },
            })
          ),
          []
        )
      })
      it.skip('helper', async () => {
        assert.deepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/entity.json',
              'id': 'test-id',
              'meta': {
                '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/meta/entity/draft-2.json',
                'aliases': ['STAT3'],
              },
            })
          ),
          []
        )
      })
    })
    describe('invalidates correctly', () => {
      it('simple', async() => {
        assert.notDeepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({})
          ),
          []
        )
      })
      it('no meta', async() => {
        assert.notDeepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/signature.json',
              'id': 'test-id',
              'meta': {},
            })
          ),
          []
        )
      })
      it('entity-deep', async () => {
        assert.notDeepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/entity.json',
              'id': 'test-id',
              'meta': {
                '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/meta/entity/draft-1.json',
              },
            })
          ),
          []
        )
      })
      it.skip('helper', async () => {
        assert.deepEqual(
          await AsyncArrayFromAsyncIterable(
            validate({
              '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/entity.json',
              'id': 'test-id',
              'meta': {
                '$schema': 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/meta/entity/draft-2.json',
                'aliases': ['STAT39'],
              },
            })
          ),
          []
        )
      })
    })
  })
})
