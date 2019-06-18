import { Entity as TypeORMEntity, Column, Generated, OneToMany } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Library } from "./library.model";

@model({
  name: 'Resource',
  description: 'A table for storing validatable resources in the database',
})
@TypeORMEntity({
  name: 'resources',
})
export class Resource extends LBEntity {
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

  @OneToMany(type => Library, library => library.resource)
  _libraries: Promise<Library[]>;

  constructor(data?: Partial<Resource>) {
    super(data);
  }
}
export const ResourceSchema = getJsonSchema(Resource)
