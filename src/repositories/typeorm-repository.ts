// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/repository-typeorm
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  EntityCrudRepository,
  Entity,
  InclusionResolver,
  DataObject,
  Options,
  Filter,
  Where,
  AnyObject,
  Count,
  Fields,
} from '@loopback/repository';
import {
  Repository,
  FindOptionsWhereCondition,
  DeepPartial,
  Brackets,
} from 'typeorm';
import {HttpErrors} from '@loopback/rest';

import {TypeORMDataSource} from '../datasources';
import {QueryDeepPartialEntity} from 'typeorm/query-builder/QueryPartialEntity';
import {UniqueIDGenerator} from '../util/unique_id_generator';

/**
 * An implementation of EntityCrudRepository using TypeORM
 */
export class TypeORMRepository<T extends Entity, ID extends string>
  implements EntityCrudRepository<T, ID> {
  inclusionResolvers: Map<string, InclusionResolver<T, Entity>> = new Map();

  typeOrmRepo: Repository<T>;
  tableName: string;
  columns: {[colName: string]: string};
  columnTypes: {[colName: string]: string};
  id_generator: UniqueIDGenerator;

  constructor(
    public entityClass: typeof Entity & {prototype: T},
    public dataSource: TypeORMDataSource,
  ) {
    this.id_generator = new UniqueIDGenerator();
  }

  async init() {
    if (this.typeOrmRepo !== null && this.typeOrmRepo !== undefined) return;
    this.typeOrmRepo = <Repository<T>>(
      await this.dataSource.getRepository(this.entityClass as any)
    );
    this.tableName = this.typeOrmRepo.metadata.tableName;
    this.columns = this.typeOrmRepo.metadata.columns.reduce(
      (columns, col) =>
        col.propertyName.startsWith('_')
          ? columns
          : {
              ...columns,
              [col.propertyName]: col.databaseName,
            },
      {},
    );
    this.columnTypes = this.typeOrmRepo.metadata.columns.reduce(
      (columns, col) =>
        col.propertyName.startsWith('_')
          ? columns
          : {
              ...columns,
              [col.propertyName]: col.type,
            },
      {},
    );
  }

  async save(entity: DataObject<T>, options?: Options): Promise<T> {
    await this.init();
    const result = await this.typeOrmRepo.save(entity as DeepPartial<T>);
    return this._removePrivate(result as T);
  }

  async update(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId();
    if (id === undefined) throw new HttpErrors.NotFound('Entity not found');
    await this.typeOrmRepo.update(
      ({id} as unknown) as FindOptionsWhereCondition<T>,
      entity as QueryDeepPartialEntity<T>,
    );
  }

  async delete(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId();
    if (id === undefined) throw new HttpErrors.NotFound('Entity not found');
    await this.typeOrmRepo.delete(({
      id,
    } as unknown) as FindOptionsWhereCondition<T>);
  }

  async findById(id: ID, filter?: Filter, options?: Options): Promise<T> {
    await this.init();

    const result = await this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect() as any)
      .where(`("${this.tableName}"."${this.columns['id']}" = :id)`, {id})
      .getRawOne();

    if (result == null) {
      throw new HttpErrors.NotFound('Entity not found');
    }
    return result;
  }

  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.init();
    await this.typeOrmRepo.update(
      ({id} as unknown) as FindOptionsWhereCondition<T>,
      data as QueryDeepPartialEntity<T>,
    );
  }

  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.init();
    // FIXME [rfeng]: TypeORM doesn't have a method for `replace`
    await this.typeOrmRepo.update(
      ({id} as unknown) as FindOptionsWhereCondition<T>,
      data as QueryDeepPartialEntity<T>,
    );
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    await this.init();
    await this.typeOrmRepo.delete(({
      id,
    } as unknown) as FindOptionsWhereCondition<T>);
  }

  async exists(id: ID, options?: Options): Promise<boolean> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(({
      id,
    } as unknown) as FindOptionsWhereCondition<T>);
    return result != null;
  }

  async create(dataObject: DataObject<T>, options?: Options): Promise<T> {
    await this.init();
    // Please note typeOrmRepo.create() only instantiates model instances.
    // It does not persist to the database.
    const result = await this.typeOrmRepo.save(dataObject as DeepPartial<T>);
    return this._removePrivate(<T>result);
  }

  async createAll(
    dataObjects: DataObject<T>[],
    options?: Options,
  ): Promise<T[]> {
    await this.init();
    const result = await this.typeOrmRepo.save(dataObjects as DeepPartial<T>[]);
    return this._removePrivate(<T[]>result);
  }

  async find(filter?: Filter<T>, options?: Options): Promise<T[]> {
    await this.init();

    if (filter === undefined) filter = {};
    const result = await this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where))
      .orderBy(this._typeormOrder(filter.order) as any)
      .skip(filter.skip)
      .take(filter.limit)
      .getRawMany();

    return result as T[];
  }

  async key_counts(filter?: Filter<T>): Promise<{[key: string]: number}> {
    await this.init();

    if (filter === undefined) filter = {};

    const queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where))
      .orderBy(this._typeormOrder(filter.order) as any);

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

  async value_counts(
    filter?: Filter<T>,
  ): Promise<{[key: string]: {[value: string]: number}}> {
    await this.init();

    if (filter === undefined) filter = {};

    const queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where))
      .orderBy(this._typeormOrder(filter.order) as any);

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

  async distinct_value_counts(
    filter?: Filter<T>,
  ): Promise<{[key: string]: number}> {
    await this.init();

    if (filter === undefined) filter = {};

    const queryset = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where))
      .orderBy(this._typeormOrder(filter.order) as any);
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

  async updateAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<Count> {
    await this.init();

    const result = await this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .update()
      .set(dataObject as QueryDeepPartialEntity<T>)
      .where(this._typeormWhere(where as any))
      .execute();

    return {count: result.generatedMaps.length};
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    await this.init();

    const result = await this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .delete()
      .where(this._typeormWhere(where as any))
      .execute();

    return {count: result.affected ?? -1};
  }

  async count(where?: Where, options?: Options): Promise<Count> {
    await this.init();
    const estimate = (options ?? {}).estimate;
    if (estimate) {
      const query = this.typeOrmRepo
        .createQueryBuilder(this.tableName)
        .where(this._typeormWhere(where as any));
      const [q_query, q_params] = query.getQueryAndParameters();
      const count_query = `explain ${q_query};`;
      const result = await this.typeOrmRepo.query(count_query, q_params);
      const r = JSON.stringify(result).match(/rows=\d*/g) ?? [];
      const count = r.reduce((acc, t) => {
        const a = parseInt(t.replace('rows=', ''));
        if (a > acc) acc = a;
        return acc;
      }, 0);
      if (count > 5000) return {count};
    }
    const query = this.typeOrmRepo
      .createQueryBuilder(this.tableName)
      .select('COUNT(*)', 'count')
      .where(this._typeormWhere(where as any));
    const {count} = await query.getRawOne();
    return {count: parseInt(count || 0)};
  }

  async execute(
    query: string | AnyObject,
    // tslint:disable:no-any
    parameters: AnyObject | any[],
    options?: Options,
  ): Promise<AnyObject> {
    await this.init();
    const result = await this.typeOrmRepo.query(
      query as string,
      parameters as any[],
    );
    return result;
  }

  _removePrivate<K extends T[] | T>(obj: K): K {
    if (Array.isArray(obj)) {
      return obj.map(o => {
        for (const col in o) {
          if (col.startsWith('_')) {
            delete o[col];
          }
        }
        return o;
      }) as K;
    } else {
      for (const col in obj) {
        if (col.startsWith('_')) {
          delete obj[col];
        }
      }
      return obj;
    }
  }

  _typeormSelect(fields?: Fields<T>) {
    if (fields === undefined) fields = [] as any;

    const typeormSelect = [];
    const jsonQueries: {[key: string]: JSON[]} = {};

    for (const field of fields as any) {
      const m = /^(.+?)(\..+)?$/.exec(field);
      if (!m)
        throw new HttpErrors.UnprocessableEntity('Field formatting error');
      if (this.columns[m[1]] === undefined)
        throw new HttpErrors.UnprocessableEntity('Column does not exist');
      if (m[2]) {
        const s = m[0].split('.').map(this._sanitize);
        if (jsonQueries[this._sanitize(m[1])] === undefined)
          jsonQueries[this._sanitize(m[1])] = [];
        jsonQueries[this._sanitize(m[1])].push(
          this._dotExpand(s.slice(1).join('.'), this._dotToCol(m[0])),
        );
      } else {
        typeormSelect.push(
          `"${this.tableName}"."${this.columns[m[1]]}" as "${m[1]}"`,
        );
      }
    }

    for (const q in jsonQueries) {
      typeormSelect.push(
        `${jsonQueries[q]
          .map(qq => `${this._jsonToBuildObject(qq)}`)
          .join('||')} as ${q}`,
      );
    }

    if (typeormSelect.length === 0) {
      return Object.keys(this.columns).map(
        c => `"${this.tableName}"."${this.columns[c]}" as "${c}"`,
      );
    } else {
      return typeormSelect;
    }
  }

  _jsonToBuildObject(obj: any): any {
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return `jsonb_build_array(${obj
          .map(k => this._jsonToBuildObject(obj[k]))
          .join(',')})`;
      } else {
        return `jsonb_build_object(${Object.keys(obj)
          .map(k => `'${k}', ${this._jsonToBuildObject(obj[k])}`)
          .join(',')})`;
      }
    } else {
      return obj;
    }
  }

  _where(qb: any, cond: any, params: any, parent: string, first: boolean) {
    if (first) {
      return qb.where(cond, params);
    } else if (parent === 'and') {
      return qb.andWhere(cond, params);
    } else if (parent === 'or') {
      return qb.orWhere(cond, params);
    }
  }

  _fullTextSearchQuery(
    fullTextSearch: any,
  ): {query: string; params: {[key: string]: string}} {
    if (typeof fullTextSearch === 'object') {
      if (fullTextSearch.and !== undefined) {
        const all_queries = [];
        const all_params = {};
        for (const el of fullTextSearch.and) {
          const {query, params} = this._fullTextSearchQuery(el);
          all_queries.push(query);
          Object.assign(all_params, params);
        }
        return {
          query: `(${all_queries.join(` && `)})`,
          params: all_params,
        };
      } else if (fullTextSearch.or !== undefined) {
        const all_queries = [];
        const all_params = {};
        for (const el of fullTextSearch.or) {
          const {query, params} = this._fullTextSearchQuery(el);
          all_queries.push(query);
          Object.assign(all_params, params);
        }
        return {
          query: `(${all_queries.join(` || `)})`,
          params: all_params,
        };
      } else if (fullTextSearch.not !== undefined) {
        const {query, params} = this._fullTextSearchQuery(fullTextSearch.not);
        return {
          query: `(!! ${query})`,
          params: params,
        };
      } else if (fullTextSearch.eq !== undefined) {
        const id = this.id_generator.id();
        return {
          query: `plainto_tsquery('english', :s_${id})`,
          params: {[`s_${id}`]: fullTextSearch.eq},
        };
      } else if (fullTextSearch.ne !== undefined) {
        const id = this.id_generator.id();
        return {
          query: `(!! plainto_tsquery('english', :s_${id}))`,
          params: {[`s_${id}`]: fullTextSearch.ne},
        };
      }
    } else if (typeof fullTextSearch === 'string') {
      const id = this.id_generator.id();
      return {
        query: `plainto_tsquery('english', :s_${id})`,
        params: {[`s_${id}`]: fullTextSearch},
      };
    }
    throw new HttpErrors.UnprocessableEntity(
      'Type not recognized for fullTextSearch query',
    );
  }

  _typeormWhere(where?: Where<T>, parent = 'and') {
    return new Brackets(qb => {
      if (where === undefined) return;
      let first = true;
      for (const key in where) {
        const condition = (where as any)[key];
        if (key === 'and') {
          let first_and = false;
          for (const cond of condition) {
            this._where(
              qb,
              this._typeormWhere(cond, 'and'),
              {},
              first_and ? parent : 'and',
              first,
            );
            first = false;
            first_and = false;
          }
        } else if (key === 'or') {
          let first_or = false;
          for (const cond of condition) {
            this._where(
              qb,
              this._typeormWhere(cond, 'or'),
              {},
              first_or ? parent : 'or',
              first,
            );
            first = false;
            first_or = false;
          }
        } else {
          const slug = this._slugify(key);

          if (condition.eq !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            if (condition.eq === null) {
              this._where(qb, `${col} is null`, {}, parent, first);
              first = false;
            } else {
              const id = this.id_generator.id();
              this._where(
                qb,
                `${col} = :${slug}_${id}`,
                {
                  [`${slug}_${id}`]: isJson
                    ? JSON.stringify(condition.eq)
                    : condition.eq,
                },
                parent,
                first,
              );
              first = false;
            }
          } else if (condition.neq !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            if (condition.neq === null) {
              this._where(qb, `${col} is not null`, {}, parent, first);
              first = false;
            } else {
              const id = this.id_generator.id();
              this._where(
                qb,
                `${col} != :${slug}_${id}`,
                {
                  [`${slug}_${id}`]: isJson
                    ? JSON.stringify(condition.neq)
                    : condition.neq,
                },
                parent,
                first,
              );
              first = false;
            }
          } else if (condition.lt !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} < :${slug}_${id}`,
              {
                [`${slug}_${id}`]: isJson
                  ? JSON.stringify(condition.lt)
                  : condition.lt,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.lte !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} <= :${slug}_${id}`,
              {
                [`${slug}_${id}`]: isJson
                  ? JSON.stringify(condition.lte)
                  : condition.lte,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.gt !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} > :${slug}_${id}`,
              {
                [`${slug}_${id}`]: isJson
                  ? JSON.stringify(condition.gt)
                  : condition.gt,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.gte !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} >= :${slug}_${id}`,
              {
                [`${slug}_${id}`]: isJson
                  ? JSON.stringify(condition.gte)
                  : condition.gte,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.inq !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} in (:...${slug}_${id})`,
              {
                [`${slug}_${id}`]:
                  condition.inq.length === 0
                    ? [null]
                    : isJson
                    ? condition.inq.map(JSON.stringify)
                    : condition.inq,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.nin !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} not in (:...${slug}_${id})`,
              {
                [`${slug}_${id}`]:
                  condition.nin.length === 0
                    ? [null]
                    : isJson
                    ? condition.nin.map(JSON.stringify)
                    : condition.nin,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.between !== undefined) {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} between :${slug}0_${id} and :${slug}1_${id}`,
              {
                [`${slug}0_${id}`]: isJson
                  ? JSON.stringify(condition.between[0])
                  : condition.between[0],
                [`${slug}1_${id}`]: isJson
                  ? JSON.stringify(condition.between[1])
                  : condition.between[1],
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.like !== undefined) {
            const col = this._dotToCol(key, true);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} like :${slug}_${id}`,
              {
                [`${slug}_${id}`]: condition.like + '',
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.nlike !== undefined) {
            const col = this._dotToCol(key, true);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} not like :${slug}_${id}`,
              {
                [`${slug}_${id}`]: condition.nlike + '',
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.ilike !== undefined) {
            const col = this._dotToCol(key, true);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} ilike :${slug}_${id}`,
              {
                [`${slug}_${id}`]: condition.ilike + '',
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.nilike !== undefined) {
            const col = this._dotToCol(key, true);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} not ilike :${slug}_${id}`,
              {
                [`${slug}_${id}`]: condition.nilike + '',
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.fullTextSearch !== undefined) {
            const col = this._dotToCol(key);
            const {query, params} = this._fullTextSearchQuery(
              condition.fullTextSearch,
            );
            this._where(
              qb,
              `to_tsvector('english', ${col}) @@ ${query}`,
              {
                ...params,
              },
              parent,
              first,
            );
            first = false;
          } else if (condition.any !== undefined) {
            const col = this._dotToCol(key, false);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} ?| :${slug}_${id}::text[]`,
              {
                [`${slug}_${id}`]: condition.any,
              },
              parent,
              first,
            );
            first = false;
          } else if (typeof condition === 'object') {
            const col = this._dotToCol(key);
            const id = this.id_generator.id();
            this._where(
              qb,
              `${col} @> :${slug}_${id}`,
              {
                [`${slug}_${id}`]: JSON.stringify(condition),
              },
              parent,
              first,
            );
            first = false;
          } else {
            const col = this._dotToCol(key);
            const isJson = col.indexOf('->') !== -1;
            if (condition === null) {
              this._where(qb, `${col} is null`, {}, parent, first);
              first = false;
            } else if (isJson && typeof condition === 'string') {
              const id = this.id_generator.id();
              this._where(
                qb,
                `${col} ? :${slug}_${id}`,
                {
                  [`${slug}_${id}`]: condition,
                },
                parent,
                first,
              );
              first = false;
            } else {
              const id = this.id_generator.id();
              this._where(
                qb,
                `${col} = :${slug}_${id}`,
                {
                  [`${slug}_${id}`]: isJson
                    ? JSON.stringify(condition)
                    : condition,
                },
                parent,
                first,
              );
              first = false;
            }
          }
        }
      }
    });
  }

  async ensureIndex(field: string, method?: string): Promise<void> {
    await this.init();
    const valid_methods = ['btree', 'gist', 'gin', 'hash'];
    if (method === undefined) {
      method = 'btree';
    } else if (valid_methods.indexOf(method) === -1) {
      throw new HttpErrors.UnprocessableEntity('Invalid index method');
    }
    await this.typeOrmRepo.query(`
      create index concurrently
      if not exists
      ${this.tableName}_${this._slugify(field)}_${method}
      on "${this.tableName}"
      using ${method}
      ((
        ${this._dotToCol(field)}
      ))`);
  }

  _typeormOrder(order?: string | string[] | {[key: string]: string}) {
    let _order;
    if (order === undefined) return {};
    if (typeof order === 'string') {
      _order = [order];
    } else if (Array.isArray(order)) {
      _order = order;
    } else if (typeof order === 'object') {
      _order = Object.keys(order).map(o => `${o} ${(order as any)[o]}`);
    } else {
      throw new HttpErrors.UnprocessableEntity('Unrecognized order type');
    }

    const typeormOrder: {[key: string]: string} = {};
    for (const o of _order) {
      const m = /^(([^ ]+?)(\.[^ ]+)?)( (ASC|DESC))?$/.exec(o);
      if (!m)
        throw new HttpErrors.UnprocessableEntity('Unrecognized order type');
      if (m[3]) {
        typeormOrder[this._dotToCol(m[1])] = m[5] || 'ASC';
      } else {
        typeormOrder[m[2]] = m[5] || 'ASC';
      }
    }

    return typeormOrder;
  }

  _dotExpand(key: string, deepObj: any) {
    let obj = deepObj;
    const expanded = key.split('.');
    for (const k of expanded.reverse()) {
      obj = {[k]: obj};
    }
    return obj;
  }

  _dotToCol(col: string, forceText?: boolean) {
    const ks = col.split('.');
    if (this.columns[ks[0]] === undefined)
      throw new HttpErrors.UnprocessableEntity('Unrecognized column');
    let col_id = `"${this.tableName}"."${this.columns[ks[0]]}"`;
    if (ks.length > 1) {
      if (forceText === true) {
        col_id +=
          (ks.length > 2 ? '->' : '') +
          ks
            .slice(1, -1)
            .map(k => `'${this._sanitize(k)}'`)
            .join('->') +
          '->>' +
          ks.slice(-1).map(k => `'${this._sanitize(k)}'`);
      } else {
        col_id +=
          '->' +
          ks
            .slice(1)
            .map(k => `'${this._sanitize(k)}'`)
            .join('->');
      }
    } else if (ks[0] === 'meta') {
      col_id = ks[0];
    } else if (this.columnTypes[ks[0]] === 'uuid') {
      col_id += '::uuid';
    } else {
      col_id += '::text';
    }
    return col_id;
  }

  _slugify(str: string) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }

  _sanitize(str: string) {
    return str.replace(/'/g, "''");
  }
}
