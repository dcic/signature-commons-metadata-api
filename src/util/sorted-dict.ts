/**
 * A convinience function for "sorting" a dictionary
 *  This doesn't really make sense but javascript preserves dict ordering,
 *  it's mostly useful for visual inspection.
 */
export function sortedDict<T>(
  obj: {[key: string]: T},
  sortFunc: (a: T, b: T) => number,
): {[key: string]: T} {
  const results = Object.keys(obj);
  results.sort((a: string, b: string) => sortFunc(obj[a], obj[b]));
  return results.reduce(
    (resultsSorted, key) => ({
      ...resultsSorted,
      [key]: obj[key],
    }),
    {},
  );
}
