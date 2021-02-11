import {
  Entity as TypeORMEntity,
  Column,
  Generated,
  Index,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import {Entity as LBEntity, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {QueryResult} from './query_result.model';

@model({
  name: 'Query',
  description: 'A query to make against the signature commons knowledge-base',
  settings: {
    strict: false,
  },
})
@TypeORMEntity({
  name: 'queries',
})
export class Query extends LBEntity {
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
  @Index('queries_meta_gin_index', {synchronize: false})
  @Column({
    name: 'meta',
    type: 'jsonb',
  })
  meta: {
    [key: string]: any;
  };

  @OneToOne(
    type => QueryResult,
    query_result => query_result._query,
    {
      cascade: ['insert', 'update', 'remove'],
      deferrable: 'INITIALLY DEFERRED',
    },
  )
  _query_result?: QueryResult;

  constructor(data?: Partial<Query>) {
    super(data);
  }
}

export const QuerySchema = getJsonSchema(Query);
