// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/repository-typeorm
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  EntityCrudRepository,
  Entity,
  DataObject,
  Options,
  Filter,
  Where,
  AnyObject,
  Count,
  AndClause,
  OrClause,
} from '@loopback/repository';
import {
  getRepository,
  Repository,
  SelectQueryBuilder,
  QueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
  FindConditions,
  DeepPartial,
  OrderByCondition,
} from 'typeorm';

import { TypeORMDataSource } from '../datasources'

import * as debugModule from 'debug';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
const debug = debugModule('loopback:repository:typeorm');

/**
 * An implementation of EntityCrudRepository using TypeORM
 */
export class TypeORMRepository<T extends Entity, ID>
  implements EntityCrudRepository<T, ID> {
  typeOrmRepo: Repository<T>;

  constructor(
    public entityClass: typeof Entity & { prototype: T },
    public dataSource: TypeORMDataSource,
  ) { }

  async init() {
    if (this.typeOrmRepo != null) return;
    this.typeOrmRepo = <Repository<T>>await this.dataSource.getRepository(
      this.entityClass,
    );
  }

  async save(entity: DataObject<T>, options?: Options): Promise<T> {
    await this.init();
    const result = await this.typeOrmRepo.save(<DeepPartial<T>>entity);
    return <T>result;
  }

  async update(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId()
    if (id === undefined)
      throw new Error("Entity not found")
    await this.typeOrmRepo.update(id, <QueryDeepPartialEntity<T>>entity);
  }

  async delete(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId()
    if (id === undefined)
      throw new Error("Entity not found")
    await this.typeOrmRepo.delete(id);
  }

  async findById(id: ID, filter?: Filter, options?: Options): Promise<T> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(id);
    if (result == null) {
      throw new Error('Not found');
    }
    return result;
  }

  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.init();
    await this.typeOrmRepo.update(id, <QueryDeepPartialEntity<T>>data);
  }

  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    await this.init();
    // FIXME [rfeng]: TypeORM doesn't have a method for `replace`
    await this.typeOrmRepo.update(id, <QueryDeepPartialEntity<T>>data);
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    await this.init();
    await this.typeOrmRepo.delete(id);
  }

  async exists(id: ID, options?: Options): Promise<boolean> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(id);
    return result != null;
  }

  async create(dataObject: DataObject<T>, options?: Options): Promise<T> {
    await this.init();
    // Please note typeOrmRepo.create() only instantiates model instances.
    // It does not persist to the database.
    const result = await this.typeOrmRepo.save(<DeepPartial<T>>dataObject);
    return <T>result;
  }

  async createAll(
    dataObjects: DataObject<T>[],
    options?: Options,
  ): Promise<T[]> {
    await this.init();
    const result = await this.typeOrmRepo.save(<DeepPartial<T>[]>dataObjects);
    return <T[]>result;
  }

  async find(filter?: Filter, options?: Options): Promise<T[]> {
    await this.init();
    const queryBuilder = await this.buildQuery(filter);
    if (debug.enabled) debug('find: %s', queryBuilder.getSql());
    const result = queryBuilder.getMany();
    return result;
  }

  async updateAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<Count> {
    await this.init();
    const queryBuilder = await this.buildUpdate(dataObject, where);
    if (debug.enabled) debug('updateAll: %s', queryBuilder.getSql());
    // FIXME [rfeng]: The result is raw data from the DB driver and it varies
    // between different DBs
    const result = await queryBuilder.execute();
    return { count: result.generatedMaps.length };
  }

  async deleteAll(where?: Where, options?: Options): Promise<Count> {
    await this.init();
    const queryBuilder = await this.buildDelete(where);
    if (debug.enabled) debug('deleteAll: %s', queryBuilder.getSql());
    // FIXME [rfeng]: The result is raw data from the DB driver and it varies
    // between different DBs
    const result = await queryBuilder.execute();
    if (result.affected === undefined) {
      if (debug.enabled) debug('Database doesn\'t support `affected`.')
      result.affected = -1
    }
    return { count: result.affected };
  }

  async count(where?: Where, options?: Options): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.count(<FindConditions<T>>where);
    return { count: result.valueOf() };
  }

  async execute(
    query: string | AnyObject,
    // tslint:disable:no-any
    parameters: AnyObject | any[],
    options?: Options,
  ): Promise<AnyObject> {
    await this.init();
    const result = await this.typeOrmRepo.query(
      <string>query,
      <any[]>parameters,
    );
    return result;
  }

  /**
   * Convert order clauses to OrderByCondition
   * @param order An array of orders
   */
  buildOrder(order: string[]) {
    let orderBy: OrderByCondition = {};
    for (const o of order) {
      const match = /^([^\s]+)( (ASC|DESC))?$/.exec(o);
      if (!match) continue;
      const field = match[1];
      const dir = (match[3] || 'ASC') as 'ASC' | 'DESC';
      orderBy[match[1]] = dir;
    }
    return orderBy;
  }

  /**
   * Build a TypeORM query from LoopBack Filter
   * @param filter Filter object
   */
  async buildQuery(filter?: Filter): Promise<SelectQueryBuilder<T>> {
    await this.init();
    const queryBuilder = this.typeOrmRepo.createQueryBuilder();
    if (!filter) return queryBuilder;
    queryBuilder.limit(filter.limit).offset(filter.offset);
    if (filter.fields) {
      queryBuilder.select(Object.keys(filter.fields));
    }
    if (filter.order) {
      queryBuilder.orderBy(this.buildOrder(filter.order));
    }
    if (filter.where) {
      queryBuilder.where(this.buildWhere(filter.where));
    }
    return queryBuilder;
  }

  /**
   * Convert where object into where clause
   * @param where Where object
   */
  buildWhere(where: Where): string {
    const clauses: string[] = [];
    if ((where as AndClause<any>).and) {
      const and = (where as AndClause<any>).and.map(w => `(${this.buildWhere(w)})`).join(' AND ');
      clauses.push(and);
    }
    if ((where as OrClause<any>).or) {
      const or = (where as OrClause<any>).or.map(w => `(${this.buildWhere(w)})`).join(' OR ');
      clauses.push(or);
    }
    // FIXME [rfeng]: Build parameterized clauses
    for (const key in where) {
      let clause;
      if (key === 'and' || key === 'or') continue;
      const condition = (where as any)[key];
      if (condition.eq) {
        clause = `${key} = ${condition.eq}`;
      } else if (condition.neq) {
        clause = `${key} != ${condition.neq}`;
      } else if (condition.lt) {
        clause = `${key} < ${condition.lt}`;
      } else if (condition.lte) {
        clause = `${key} <= ${condition.lte}`;
      } else if (condition.gt) {
        clause = `${key} > ${condition.gt}`;
      } else if (condition.gte) {
        clause = `${key} >= ${condition.gte}`;
      } else if (condition.inq) {
        const vals = condition.inq.join(', ');
        clause = `${key} IN (${vals})`;
      } else if (condition.between) {
        const v1 = condition.between[0];
        const v2 = condition.between[1];
        clause = `${key} BETWEEN ${v1} AND ${v2}`;
      } else {
        // Shorthand form: {x:1} => X = 1
        clause = `${key} = ${condition}`;
      }
      clauses.push(clause);
    }
    return clauses.join(' AND ');
  }

  /**
   * Build an `update` statement from LoopBack-style parameters
   * @param dataObject Data object to be updated
   * @param where Where object
   */
  async buildUpdate(dataObject: DataObject<T>, where?: Where) {
    await this.init();
    let queryBuilder = this.typeOrmRepo
      .createQueryBuilder()
      .update(this.entityClass)
      .set(dataObject);
    if (where) queryBuilder.where(this.buildWhere(where));
    return queryBuilder;
  }

  /**
   * Build a `delete` statement from LoopBack-style parameters
   * @param where Where object
   */
  async buildDelete(where?: Where) {
    await this.init();
    let queryBuilder = this.typeOrmRepo
      .createQueryBuilder()
      .delete()
      .from(this.entityClass);
    if (where) queryBuilder.where(this.buildWhere(where));
    return queryBuilder;
  }
}
