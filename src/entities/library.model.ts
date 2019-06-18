import { Entity as TypeORMEntity, Column, OneToMany, Index, Generated, ManyToOne, JoinColumn, } from "typeorm";
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Signature } from "./signature.model";
import { Resource } from "./resource.model";

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
    type: 'string',
    required: false,
  })
  @Index()
  @Column({
    name: 'resource',
  })
  resource: string;

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
    name: 'dataset_type',
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
    type: 'jsonb',
    default: [],
  })
  signature_keys: JSON;

  @ManyToOne(type => Resource, resource => resource._libraries)
  @JoinColumn({
    name: 'resource',
    referencedColumnName: 'id'
  })
  _resource: Promise<Resource>;

  @OneToMany(type => Signature, signature => signature._library)
  _signatures: Promise<Signature[]>;

  constructor(data?: Partial<Library>) {
    super(data);
  }
}

export const LibrarySchema = getJsonSchema(Library)
