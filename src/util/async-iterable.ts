/**
 * Convert an asyncronous iterable to an asyncronous array
 * 
 * @param arr Async Iterable
 */
export async function AsyncArrayFromAsyncIterable<T>(arr: AsyncIterable<T>): Promise<Array<T>> {
  let ret: T[] = []

  for await(const el of arr) {
    ret = ret.concat(el)
  }

  return ret
}
