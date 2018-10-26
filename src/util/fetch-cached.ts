import fetch from 'node-fetch'

const cache: {
  [key: string]: object
} = {}

/**
 * Fetch object from remote, caching any results
 * @param url The url to fetch the object from
 */
export async function fetch_cached<T extends {} = {}>(url: string): Promise<T> {
  if(cache[url] === undefined)
    cache[url] = await (await fetch(url)).json()

  return cache[url] as T
}
