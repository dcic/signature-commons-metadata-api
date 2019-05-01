import { Entity as TypeORMEntity, Column, PrimaryGeneratedColumn, Connection } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Entity',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
})
@TypeORMEntity('entities')
export class Entity extends LBEntity {
  @property({
    type: 'string',
    required: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  @Column('jsonb')
  meta: {
    [key: string]: any
  };

  constructor(data?: Partial<Entity>) {
    super(data);
  }
}

export const EntitySchema = getJsonSchema(Entity)

// @ViewEntity({
//   expression: `
//   with recursive r as (
//       select
//         v.key::text as key,
//         v.value as value
//       from
//         entities,
//         jsonb_each(entities.meta::jsonb) as v
//     union all
//       select _r.*
//       from
//         r cross join lateral (
//           select
//             concat(r.key::text, '.', r_obj.key::text) as key,
//             r_obj.value as value
//           from jsonb_each(r.value) as r_obj
//           where jsonb_typeof(r.value) = 'object'
//             union
//           select
//             r.key::text as key,
//             r_arr.value as value
//           from jsonb_array_elements(r.value) as r_arr
//           where jsonb_typeof(r.value) = 'array'
//         ) as _r
//       where jsonb_typeof(_r.value) not in ('object', 'array')
//   )
//   select
//     r.key as "key",
//     r.value as "value",
//     count(*) as "count"
//   from
//     r
//   `
// })
// export class EntityKeyValueCounts {
//   @ViewColumn()
//   key: string;

//   @ViewColumn()
//   value: string;

//   @ViewColumn()
//   count: number;
// };
