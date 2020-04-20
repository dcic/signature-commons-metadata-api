function hashCode(s: string) {
  // https://stackoverflow.com/a/7616484
  var hash = 0, i, chr
  if (s.length === 0) return hash
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export async function resolve(val: any, cb: (val: any, ctx: any, cache?: any) => Promise<any>, ctx: any, cache?: any): Promise<any> {
  if (val === undefined) { return val }
  if (cache === undefined) { cache = {} }
  const hash = hashCode(JSON.stringify(val))
  let result: any
  if (cache[hash] !== undefined) {
    return cache[hash]
  } else if (typeof val === 'object' && val['$resolve'] !== undefined) {
    result = await cb(val['$resolve'], ctx, cache)
  } else if (typeof val === 'object' && Array.isArray(val)) {
    result = await Promise.all(val.map(v => resolve(v, cb, ctx, cache)))
  } else if (typeof val === 'object') {
    result = {}
    for (const k in val) {
      result[k] = await resolve(val[k], cb, ctx, cache)
    }
  } else {
    return val
  }
  cache[hash] = result
  return result
}
