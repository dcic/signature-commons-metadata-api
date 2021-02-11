import {ViewEntity, ViewColumn} from 'typeorm';

@ViewEntity({
  expression: `
    select
      key,
      value,
      count(*) as count
    from
      resources
    inner join lateral
      jsonb_deep_key_value(row_to_json(resources)::jsonb) on true
    group by key, value
    order by count desc;
  `,
  materialized: true,
})
export class ResourceKeyValueCount {
  @ViewColumn()
  key: string;

  @ViewColumn()
  value: string;

  @ViewColumn()
  count: number;
}
