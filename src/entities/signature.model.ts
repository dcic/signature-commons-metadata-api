import { Entity as TypeORMEntity, Column, ManyToOne, Generated, JoinColumn, Index, } from 'typeorm';
import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { Library } from './library.model';

@model({
  name: 'Signature',
  description: 'A single signature consisting of weighted associations of entities',
  settings: {
    strict: false
  },
})
@TypeORMEntity({
  name: 'signatures',
})
export class Signature extends LBEntity {
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
    type: 'string',
    required: true,
  })
  @Index()
  @Column({
    name: 'libid',
  })
  library: string;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  @Index('signatures_meta_gin_index', { synchronize: false })
  @Index('signatures_meta_gist_fts_index', { synchronize: false })
  @Column({
    type: 'jsonb',
  })
  meta: {
    [key: string]: any
  };

  @ManyToOne(type => Library, library => library._signatures)
  @JoinColumn({
    name: 'libid',
    referencedColumnName: 'id'
  })
  _library: Promise<Library>;


  constructor(data?: Partial<Signature>) {
    super(data);
  }
}
export const SignatureSchema = getJsonSchema(Signature)
