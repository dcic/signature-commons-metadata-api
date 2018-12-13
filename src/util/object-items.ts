/**
 * Python style `items` returns tuple of dict ([key, value])
 * @param obj Object to enumerate the key/values as tuples
 */
export function ObjectItems(obj: { [k: string]: any }): [string, any][] {
  if (Array.isArray(obj)) {
    return obj.map(
      (v) => ['', v] as [string, any]
    )
  } else if (typeof obj === 'object') {
    return Object.keys(obj).map(
      (k) => [k, obj[k]] as [string, any]
    )
  } else {
    return []
  }
}
