import { ObjectItems } from './object-items'
import debug from '../util/debug';

/**
 * keyCounts helper function lets us count the number of keys
 *
 * @param objs The objects to enumerate the keys of
 * @param depth The depth to go into object keys
 */
export function keyCounts(objs: any[], depth: number = 0) {
  const key_counts: { [key: string]: number } = {}

  for (const obj of objs) {
    let Q = ObjectItems(obj) as [string, any][]
    let d = depth
    while (Q.length > 0) {
      let [k, v] = Q.pop() as [string, any]

      if (key_counts[k] === undefined)
        key_counts[k] = 0
      key_counts[k] += 1


      if (k.replace(/[^\.]/g, '').length < d) {
        try {
          if (typeof v === 'object') {
            Q = Q.concat(
              ObjectItems(v).map(
                ([kk, vv]) =>
                  [
                    [k, kk].filter(
                      (kkk) => kkk !== ''
                    ).join('.'),
                    vv
                  ] as [string, any]
              ) as [string, any][]
            )
          }
        } catch (e) {
          debug(e)
        }
      }
    }
  }

  return key_counts
}

/**
 * valueCounts helper function lets us count the number of values
 *
 * @param objs The objects to enumerate the values of
 * @param depth The depth to go into object keys
 */
export function valueCounts(objs: any[], depth: number = 0) {
  const key_value_counts: { [key: string]: { [value: string]: number } } = {}

  for (const obj of objs) {
    let Q = ObjectItems(obj)
    let d = depth
    while (Q.length > 0) {
      let [k, v] = Q.pop() as [string, any]

      let v_str
      if (Array.isArray(v))
        v_str = '[array]'
      else if (typeof v === 'object')
        v_str = '[object]'
      else
        v_str = v + ''

      if (key_value_counts[k] === undefined)
        key_value_counts[k] = {}
      if (key_value_counts[k][v_str] === undefined)
        key_value_counts[k][v_str] = 0
      key_value_counts[k][v_str] += 1

      if (k.replace(/[^\.]/g, '').length < d) {
        try {
          if (typeof v === 'object') {
            Q = Q.concat(
              ObjectItems(v).map(
                ([kk, vv]) =>
                  [
                    [k, kk].filter(
                      (kkk) => kkk !== ''
                    ).join('.'),
                    vv
                  ] as [string, any]
              ) as [string, any][]
            )
          }
        } catch (e) { }
      }
    }
  }

  return key_value_counts
}
