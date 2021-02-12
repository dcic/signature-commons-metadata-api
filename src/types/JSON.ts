export type JSONLiteral = string | number | boolean | null;

export type JSONArray = JSON[];

export type JSONObject = {
  [key: string]: JSON;
};

export type JSON = JSONLiteral | JSONObject | JSONArray;
