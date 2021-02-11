import {
  Entity as TypeORMEntity,
  Column,
  Generated,
  Index,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {Entity as LBEntity, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {Query} from './query.model';
import {SignatureResult} from './signature_result.model';

@model({
  name: 'QueryResult',
  description: 'The result of a registered query',
  settings: {
    strict: false,
  },
})
@TypeORMEntity({
  name: 'query_results',
})
export class QueryResult extends LBEntity {
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
  @Index('query_results_meta_gin_index', {synchronize: false})
  @Column({
    name: 'meta',
    type: 'jsonb',
  })
  meta: {
    [key: string]: any;
  };

  @OneToOne(
    type => Query,
    query => query._query_result,
    {
      cascade: ['insert', 'update'],
      deferrable: 'INITIALLY DEFERRED',
    },
  )
  @JoinColumn({
    name: 'query_id',
    referencedColumnName: 'id',
  })
  _query: Query;

  @OneToMany(
    type => SignatureResult,
    signature_result => signature_result._query_result,
    {
      cascade: ['insert', 'update', 'remove'],
      deferrable: 'INITIALLY DEFERRED',
    },
  )
  _signature_results: SignatureResult[];

  constructor(data?: Partial<Query>) {
    super(data);
  }
}

export const QueryResultSchema = getJsonSchema(QueryResult);
