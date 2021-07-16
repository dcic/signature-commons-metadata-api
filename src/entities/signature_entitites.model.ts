import {
  Entity as TypeORMEntity,
  Column,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import {Entity, Entity as LBEntity, model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {Entity as SigcomEntity} from './entity.model';
import {Signature} from './signature.model';

@model({
  name: 'Signatures Entities',
  description: 'Defines the relationship between signatures and entities',
  settings: {
    strict: false,
  },
})
@TypeORMEntity({
  name: 'signatures_entities',
})
export class SignatureEntity extends LBEntity {
  @ManyToOne(
    () => Signature,
    signature => signature.entities,
  )
  @JoinColumn({
    name: 'signature',
    referencedColumnName: 'id',
  })
  @PrimaryColumn({
    name: 'signature',
    type: 'uuid',
  })
  @Index()
  signature: Signature;

  @ManyToOne(
    () => SigcomEntity,
    entities => entities.signatures,
  )
  @JoinColumn({
    name: 'entity',
    referencedColumnName: 'id',
  })
  @PrimaryColumn({
    name: 'entity',
    type: 'uuid',
  })
  @Index()
  entity: Entity;

  @Column({
    name: 'direction',
    type: 'varchar',
    primary: true,
    default: '-',
  })
  direction: string;

  constructor(data?: Partial<SignatureEntity>) {
    super(data);
  }
}
export const SignatureEntitySchema = getJsonSchema(SignatureEntity);
