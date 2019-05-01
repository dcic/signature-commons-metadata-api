import { Entity as TypeORMEntity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Library } from "./library.model";

@model({
  name: 'Signature',
  description: 'A single signature consisting of weighted associations of entities',
})
@TypeORMEntity('signatures')
export class Signature extends LBEntity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  @Column()
  library: string;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  @Column('jsonb')
  meta: {
    [key: string]: any
  };

  @ManyToOne(type => Library, library => library._signatures)
  _library: Promise<Library>;


  constructor(data?: Partial<Signature>) {
    super(data);
  }
}
export const SignatureSchema = getJsonSchema(Signature)

// @ViewEntity({
//   expression: `
//   with recursive r as (
//       select
//         v.key::text as key,
//         v.value as value
//       from
//         signatures,
//         jsonb_each(signatures.meta::jsonb) as v
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
// export class SignatureKeyValueCounts {
//   @ViewColumn()
//   key: string;

//   @ViewColumn()
//   value: string;

//   @ViewColumn()
//   count: number;
// };
