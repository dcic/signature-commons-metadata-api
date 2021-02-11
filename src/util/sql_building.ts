export function safe_query_helper(
  callback: (safe: (literal: string | number) => string) => string,
  existing_params?: any[],
): {query: string; literals: (string | number)[]} {
  let id = 0;
  const literals: (string | number)[] = existing_params ?? [];
  const safe = (literal: string | number) => {
    literals.push(literal);
    return '$' + id++;
  };
  return {
    query: callback(safe),
    literals,
  };
}

export function safe_filter_limit(
  safe: (limit: string | number) => string,
  filter?: {limit?: number},
): string {
  const limit = (filter ?? {}).limit;
  return limit ? `limit ${safe(limit)}` : ``;
}

export function safe_filter_offset(
  safe: (limit: string | number) => string,
  filter?: {offset?: number; skip?: number},
): string {
  const offset = (filter ?? {}).offset ?? (filter ?? {}).skip;
  return offset ? `offset ${safe(offset)}` : ``;
}
