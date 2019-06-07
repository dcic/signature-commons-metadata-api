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
} from '@loopback/repository';
import {
  Repository,
  FindConditions,
  DeepPartial,
  Equal,
  Not,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Between,
  In,
  Any,
} from 'typeorm';

import { TypeORMDataSource } from '../datasources'

import * as debugModule from 'debug';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
const debug = debugModule('loopback:repository:typeorm');

/**
 * An implementation of EntityCrudRepository using TypeORM
 */
export class TypeORMRepository<T extends Entity, ID extends string>
  implements EntityCrudRepository<T, ID> {
  typeOrmRepo: Repository<T>;

  constructor(
    public entityClass: typeof Entity & { prototype: T },
    public dataSource: TypeORMDataSource,
  ) { }

  async init() {
    if (this.typeOrmRepo != null) return;
    this.typeOrmRepo = <Repository<T>>await this.dataSource.getRepository(
      this.entityClass as any,
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
    const result = await this.typeOrmRepo.findOne({ id } as FindConditions<T>);
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

  async find(filter?: Filter<T>, options?: Options): Promise<T[]> {
    await this.init();

    if (filter === undefined) filter = {}

    const typeorm_filter = {
      select: filter.fields,
      relations: filter.include,
      where: this._typeormWhere(filter.where),
      order: filter.order,
      skip: filter.skip,
      take: filter.limit,
    }

    const result = await this.typeOrmRepo.find(typeorm_filter as FindConditions<T>)
    return result;
  }

  async updateAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.update(
      this._typeormWhere(where as any) as FindConditions<T>,
      dataObject as QueryDeepPartialEntity<T>
    )
    return { count: result.generatedMaps.length };
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.delete(
      this._typeormWhere(where as Where<T>) as FindConditions<T>
    )
    return { count: result.affected || -1 };
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

  _typeormWhere(where?: Where<T>) {
    if (where === undefined) return {}

    const typeormWhere: { [key: string]: any } = {}

    for (const key in where) {
      const condition = (where as any)[key]
      if (condition.and) {
        for (const obj of condition.and) {
          Object.assign(typeormWhere, obj)
        }
      } else if (condition.or) {
        typeormWhere[key] = Any(condition.or)
      } else if (condition.eq) {
        typeormWhere[key] = Equal(condition.eq)
      } else if (condition.neq) {
        typeormWhere[key] = Not(condition.neq)
      } else if (condition.lt) {
        typeormWhere[key] = LessThan(condition.lt)
      } else if (condition.lte) {
        typeormWhere[key] = LessThanOrEqual(condition.lte)
      } else if (condition.gt) {
        typeormWhere[key] = MoreThan(condition.gt)
      } else if (condition.gte) {
        typeormWhere[key] = MoreThanOrEqual(condition.gte)
      } else if (condition.inq) {
        typeormWhere[key] = In(condition.inq)
      } else if (condition.between) {
        typeormWhere[key] = Between(condition.between[0], condition.between[1])
      } else {
        typeormWhere[key] = condition
      }
    }

    return typeormWhere
  }
}
