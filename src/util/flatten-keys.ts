export function flatten_keys(obj: object) {
  const new_obj: any = { ...obj }
  const done = new Set()
  let changed = true
  while (changed) {
    changed = false

    for (const key of Object.keys(new_obj)) {
      if (done.has(key)) continue

      if (Array.isArray(new_obj[key]) || typeof new_obj[key] !== 'object') {
        changed = true
        done.add(key)
      } else if (typeof new_obj[key] === 'object') {
        for (const k of Object.keys(new_obj[key])) {
          new_obj[`${key}.${k}`] = new_obj[key][k]
          changed = true
        }
        delete new_obj[key]
      }
    }
  }
  return new_obj
}
