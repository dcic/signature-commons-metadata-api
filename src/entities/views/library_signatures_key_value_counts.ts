import {ViewEntity, ViewColumn} from 'typeorm';

@ViewEntity({
  expression: `
    select
      libraries.uuid as library,
      key,
      value,
      count(*) as count
    from
      libraries
      inner join
        signatures on signatures.libid = libraries.uuid
      inner join lateral
        jsonb_deep_key_value(row_to_json(signatures)::jsonb) on true
    group by libraries.uuid, key, value
    order by count desc;
  `,
  materialized: true,
})
export class LibrarySignaturesKeyValueCount {
  @ViewColumn()
  library: string;

  @ViewColumn()
  key: string;

  @ViewColumn()
  value: string;

  @ViewColumn()
  count: number;
}
