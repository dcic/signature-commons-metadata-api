import { Entity as TypeORMEntity, Column, PrimaryGeneratedColumn, OneToMany, Index } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Signature } from "./signature.model";

@model({
  name: 'Library',
  description: 'Collections of related signatures',
})
@TypeORMEntity('libraries')
export class Library extends LBEntity {
  @property({
    type: 'string',
    required: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  @Index()
  @Column()
  dataset: string;

  @property({
    type: 'string',
    required: true,
  })
  @Index()
  @Column()
  dataset_type: string;

  @property({
    type: 'object',
    required: true,
  })
  @Column('jsonb')
  meta: {
    [key: string]: any
  };

  @property({
    type: 'array',
    itemType: 'string',
    required: false,
  })
  @Column('simple-array')
  Signature_keys: JSON;

  @OneToMany(type => Signature, signature => signature._library)
  _signatures: Promise<Signature[]>;

  constructor(data?: Partial<Library>) {
    super(data);
  }
}

export const LibrarySchema = getJsonSchema(Library)

// @ViewEntity({
//   expression: `
//   with recursive r as (
//       select
//         v.key::text as key,
//         v.value as value
//       from
//         libraries,
//         jsonb_each(libraries.meta::jsonb) as v
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
// export class LibraryKeyValueCounts {
//   @ViewColumn()
//   key: string;

//   @ViewColumn()
//   value: string;

//   @ViewColumn()
//   count: number;
// };
