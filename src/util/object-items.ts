/**
 * Python style `items` returns tuple of dict ([key, value])
 * @param obj Object to enumerate the key/values as tuples
 */
export function ObjectItems(obj: { [k: string]: any }): [string, any][] {
  return Object.keys(obj).map(
    (k) => [k, obj[k]] as [string, any]
  )
}
