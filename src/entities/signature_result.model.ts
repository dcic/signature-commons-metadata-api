import {
  Entity as TypeORMEntity,
  Column,
  Generated,
  Index,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import {Entity as LBEntity, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {Query} from './query.model';
import {QueryResult} from './query_result.model';
import {Signature} from './signature.model';

@model({
  name: 'SignatureResult',
  description: 'The result of a registered query',
  settings: {
    strict: false,
  },
})
@TypeORMEntity({
  name: 'signature_results',
})
@Index(
  (signature_result: SignatureResult) => [
    signature_result._query_result,
    signature_result._signature,
  ],
  {unique: true},
)
export class SignatureResult extends LBEntity {
  @Column({
    name: 'id',
    primary: true,
    select: false,
    unique: true,
  })
  @Generated()
  _id: number;

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

  @CreateDateColumn({
    name: 'created',
  })
  created: Date;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  @Index('signature_result_meta_gin_index', {synchronize: false})
  @Column({
    name: 'meta',
    type: 'jsonb',
  })
  meta: {
    [key: string]: any;
  };

  @ManyToOne(
    type => QueryResult,
    query_result => query_result._signature_results,
    {
      cascade: ['insert', 'update'],
      deferrable: 'INITIALLY DEFERRED',
    },
  )
  @JoinColumn({
    name: 'query_result_id',
    referencedColumnName: 'id',
  })
  _query_result: QueryResult;

  @ManyToOne(type => Signature, {
    cascade: ['insert', 'update'],
    deferrable: 'INITIALLY DEFERRED',
  })
  @JoinColumn({
    name: 'signature_id',
    referencedColumnName: 'id',
  })
  _signature: Signature;

  constructor(data?: Partial<Query>) {
    super(data);
  }
}

export const SignatureResultSchema = getJsonSchema(SignatureResult);
