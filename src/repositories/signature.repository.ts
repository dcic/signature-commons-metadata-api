import {Filter, Where, Count} from '@loopback/repository';
import {Signature} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class SignatureRepository extends TypeORMRepository<
  Signature,
  typeof Signature.prototype.id
> {
  dataSource: TypeORMDataSource;
  _select: 'signatures.uuid as id, signatures.libid as library, signatures.meta as meta';
  relation: string;
  inverseTable: string;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(Signature, dataSource);
  }

  async initialize() {
    await this.init();
    if (this.relation !== null && this.relation !== undefined) return;

    const relations = this.typeOrmRepo.metadata.relations.filter(
      i => i.isManyToMany,
    );
    this.relation = relations[0].propertyName;
    this.inverseTable = relations[0].inverseEntityMetadata.tableName;
  }

  async find_through(
    id?: string,
    filter?: Filter<Signature>,
  ): Promise<Signature[]> {
    await this.initialize();
    if (filter === undefined) filter = {};
    let query = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._select)
      .innerJoin(this.tableName + '.' + this.relation, this.inverseTable)
      .where(this.inverseTable + '.uuid = :id', {id})
      .orderBy(this._typeormOrder(filter.order) as any)
      .offset(filter.skip)
      .limit(filter.limit);
    if (
      filter.where !== undefined &&
      Object.keys(filter.where || {}).length > 0
    ) {
      query = query.andWhere(this._typeormWhere(filter.where));
    }
    const result = await query.getRawMany();
    return result as Signature[];
  }

  async count_through(id?: string, where?: Where): Promise<Count> {
    await this.initialize();
    let query = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._select)
      .innerJoin(this.tableName + '.' + this.relation, this.inverseTable)
      .where(this.inverseTable + '.uuid = :id', {id});
    if (Object.keys(where || {}).length > 0) {
      query = query.andWhere(this._typeormWhere(where as any));
    }
    const result = await query.getCount();

    return {count: result.valueOf()};
  }

  async key_counts_through(
    id?: string,
    filter?: Filter<Signature>,
  ): Promise<{[key: string]: number}> {
    await this.initialize();

    if (filter === undefined) filter = {};
    let queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .innerJoin(this.tableName + '.' + this.relation, this.inverseTable)
      .where(this.inverseTable + '.uuid = :id', {id})
      .orderBy(this._typeormOrder(filter.order) as any);
    if (
      filter.where !== undefined &&
      Object.keys(filter.where || {}).length > 0
    ) {
      queryset = queryset.andWhere(this._typeormWhere(filter.where));
    }

    const [queryset_query, queryset_params] = queryset.getQueryAndParameters();
    const params = [
      ...queryset_params,
      ...(filter.skip ? [filter.skip] : []),
      ...(filter.limit ? [filter.limit] : []),
    ];
    const results = await this.typeOrmRepo.query(
      `
      select
        key,
        count(*) as count
      from
        (
          ${queryset_query}
        ) qs inner join lateral jsonb_deep_key_value(row_to_json(qs)::jsonb) on true
      where value != 'null'::jsonb
      group by key
      order by count desc
      ${filter.skip ? `offset $${1 + queryset_params.length}` : ''}
      ${
        filter.limit
          ? `limit $${1 + queryset_params.length + (filter.skip ? 1 : 0)}`
          : ''
      }
    `,
      params,
    );
    const counts: {[key: string]: number} = {};
    for (const {key, count} of results) {
      counts[key] = Number(count);
    }
    return counts;
  }

  async value_counts_through(
    id?: string,
    filter?: Filter<Signature>,
  ): Promise<{[key: string]: {[value: string]: number}}> {
    await this.init();

    if (filter === undefined) filter = {};

    let queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .innerJoin(this.tableName + '.' + this.relation, this.inverseTable)
      .where(this.inverseTable + '.uuid = :id', {id})
      .orderBy(this._typeormOrder(filter.order) as any);
    if (
      filter.where !== undefined &&
      Object.keys(filter.where || {}).length > 0
    ) {
      queryset = queryset.andWhere(this._typeormWhere(filter.where));
    }

    const [queryset_query, queryset_params] = queryset.getQueryAndParameters();
    const params = [
      ...queryset_params,
      ...(filter.skip ? [filter.skip] : []),
      ...(filter.limit ? [filter.limit] : []),
    ];
    const results = await this.typeOrmRepo.query(
      `
      select
        key,
        value,
        count(*) as count
      from
        (
          ${queryset_query}
        ) qs inner join lateral jsonb_deep_key_value(row_to_json(qs)::jsonb) on true
      where value != 'null'::jsonb
      group by key, value
      order by count desc
      ${filter.skip ? `offset $${1 + queryset_params.length}` : ''}
      ${
        filter.limit
          ? `limit $${1 + queryset_params.length + (filter.skip ? 1 : 0)}`
          : ''
      }
    `,
      params,
    );
    const counts: {[key: string]: {[value: string]: number}} = {};
    for (const {key, value, count} of results) {
      if (counts[key] === undefined) counts[key] = {};
      counts[key][value] = Number(count);
    }
    return counts;
  }

  async distinct_value_counts_through(
    id?: string,
    filter?: Filter<Signature>,
  ): Promise<{[key: string]: number}> {
    await this.init();

    if (filter === undefined) filter = {};

    let queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .innerJoin(this.tableName + '.' + this.relation, this.inverseTable)
      .where(this.inverseTable + '.uuid = :id', {id})
      .orderBy(this._typeormOrder(filter.order) as any);
    if (
      filter.where !== undefined &&
      Object.keys(filter.where || {}).length > 0
    ) {
      queryset = queryset.andWhere(this._typeormWhere(filter.where));
    }
    const [queryset_query, queryset_params] = queryset.getQueryAndParameters();

    const params = [
      ...queryset_params,
      ...(filter.skip ? [filter.skip] : []),
      ...(filter.limit ? [filter.limit] : []),
    ];
    const results = await this.typeOrmRepo.query(
      `
      select distinct
        key,
        count(*) as count
      from
        (
          ${queryset_query}
        ) qs inner join lateral jsonb_deep_key_value(row_to_json(qs)::jsonb) on true
      where value != 'null'::jsonb
      group by key, value
      order by count desc
      ${filter.skip ? `offset $${1 + queryset_params.length}` : ''}
      ${
        filter.limit
          ? `limit $${1 + queryset_params.length + (filter.skip ? 1 : 0)}`
          : ''
      }
    `,
      params,
    );

    const counts: {[key: string]: number} = {};
    for (const {key, count} of results) {
      counts[key] = Number(count);
    }
    return counts;
  }
}
