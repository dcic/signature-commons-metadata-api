import { Entity as TypeORMEntity, Column, OneToMany, Index, Generated, } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Signature } from "./signature.model";

@model({
  name: 'Library',
  description: 'Collections of related signatures',
})
@TypeORMEntity({
  name: 'libraries',
})
export class Library extends LBEntity {
  @Column({
    name: 'id',
    primary: true,
    select: false
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
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  @Index()
  @Column({
    name: 'dataset',
  })
  dataset: string;

  @property({
    type: 'string',
    required: true,
  })
  @Index()
  @Column({
    name: 'meta',
  })
  dataset_type: string;

  @property({
    type: 'object',
    required: true,
  })
  @Column({
    name: 'meta',
    type: 'jsonb',
  })
  meta: {
    [key: string]: any
  };

  @property({
    type: 'array',
    itemType: 'string',
    required: false,
  })
  @Column({
    name: 'signature_keys',
    type: 'simple-array',
  })
  signature_keys: JSON;

  @OneToMany(type => Signature, signature => signature._library)
  _signatures: Promise<Signature[]>;

  constructor(data?: Partial<Library>) {
    super(data);
  }
}

export const LibrarySchema = getJsonSchema(Library)
