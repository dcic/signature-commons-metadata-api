import { Entity as TypeORMEntity, Column, Generated, Index, } from 'typeorm';
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Entity',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
})
@TypeORMEntity({
  name: 'entities',
})
export class Entity extends LBEntity {
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
  @Index()
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
  @Index('entities_meta_gin_index', { synchronize: false })
  @Index('entities_meta_gist_fts_index', { synchronize: false })
  @Column('jsonb')
  meta: {
    [key: string]: any
  };

  constructor(data?: Partial<Entity>) {
    super(data);
  }
}

export const EntitySchema = getJsonSchema(Entity)
