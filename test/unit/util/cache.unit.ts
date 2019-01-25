import * as assert from 'assert'
import { PriorityCache } from '../../../src/util/cache'

describe('util', () => {
  describe('cache', () => {
    it('works properly', () => {
      const cache = new PriorityCache(10)

      cache.put('a', 'b', { size: 5, cost: 30 })
      console.log(cache.store)
      cache.put('c', 'd', { size: 5, cost: 70 })
      console.log(cache.store)
      cache.get('a')
      console.log(cache.store)
      cache.put('e', 'f', { size: 4, cost: 20 })
      console.log(cache.store)

      assert.equal(cache.get('a'), 'b')
      assert.equal(cache.get('c'), 'd')
      assert.equal(cache.get('e'), undefined)

      cache.get('c')
      cache.put('g', 'h', { size: 4, cost: 70 })
      assert.equal(cache.get('a'), undefined)
      assert.equal(cache.get('g'), 'h')
    })
  })
})
