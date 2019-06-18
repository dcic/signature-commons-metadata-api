import { Entity as TypeORMEntity, Column, Generated } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Schema',
  description: 'A table for storing validatable schemas in the database',
})
@TypeORMEntity({
  name: 'schemas',
})
export class Schema extends LBEntity {
  @Column({
    name: 'id',
    primary: true,
    select: false,
    unique: true,
  })
  @Generated()
  _id: number

  @property({
    type: 'string',
    id: true,
    required: true,
  })
  @Column({
    name: 'uuid',
    type: 'uuid',
    unique: true,
  })
  id: string;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  @Column({
    type: 'jsonb',
  })
  meta: {
    [key: string]: any
  };

  constructor(data?: Partial<Schema>) {
    super(data);
  }
}
export const SchemaSchema = getJsonSchema(Schema)
