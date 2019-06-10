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
  Raw,
} from 'typeorm';

import { TypeORMDataSource } from '../datasources'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

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
    const result = await this.typeOrmRepo.save(entity as DeepPartial<T>);
    return this._removePrivate(result as T);
  }

  async update(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId()
    if (id === undefined)
      throw new Error("Entity not found")
    await this.typeOrmRepo.update(
      { id } as FindConditions<T>,
      entity as QueryDeepPartialEntity<T>
    );
  }

  async delete(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId()
    if (id === undefined)
      throw new Error("Entity not found")
    await this.typeOrmRepo.delete({ id } as FindConditions<T>);
  }

  async findById(id: ID, filter?: Filter, options?: Options): Promise<T> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(
      { id, select: this._columns() } as FindConditions<T>
    );
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
    await this.typeOrmRepo.update(
      { id } as FindConditions<T>,
      data as QueryDeepPartialEntity<T>
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
      { id } as FindConditions<T>,
      data as QueryDeepPartialEntity<T>
    );
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    await this.init();
    await this.typeOrmRepo.delete({ id } as FindConditions<T>);
  }

  async exists(id: ID, options?: Options): Promise<boolean> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(
      { id } as FindConditions<T>
    );
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

    if (filter === undefined) filter = {}

    const typeorm_filter = {
      select: filter.fields === undefined ? this._columns() : filter.fields,
      relations: filter.include,
      where: this._typeormWhere(filter.where),
      order: filter.order,
      skip: filter.skip,
      take: filter.limit,
    }

    const result = await this.typeOrmRepo.find(
      typeorm_filter as FindConditions<T>
    )
    return result;
  }

  async updateAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.update(
      this._typeormWhere(where as Where<T>) as FindConditions<T>,
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
    const result = await this.typeOrmRepo.count(
      this._typeormWhere(where as Where<T>) as FindConditions<T>
    );
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
      query as string,
      parameters as any[],
    );
    return result;
  }

  _removePrivate<K extends T[] | T>(obj: K): K {
    if (Array.isArray(obj)) {
      return obj.map(
        (o) => {
          for (var col in o) {
            if (col.startsWith('_')) {
              delete o[col]
            }
          }
          return o
        }
      ) as K
    } else {
      for (var col in obj) {
        if (col.startsWith('_')) {
          delete obj[col]
        }
      }
      return obj
    }
  }

  _columns() {
    return this.typeOrmRepo.metadata.columns.map(
      (col) => col.propertyName
    ).filter(
      (col) => !col.startsWith('_')
    )
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
      } else if (condition.fullTextSearch) {
        // Safer but not yet implemented upstream
        // typeormWhere[key] = Raw(
        //   alias => `to_tsvector('english', ${alias}) @@ plainto_tsquery('english', ?)`,
        //   condition.fullTextSearch
        // )
        typeormWhere[key] = Raw(alias =>
          `to_tsvector('english', ${alias}) @@ plainto_tsquery('english', '${this._sanitize(condition.fullTextSearch)}')`,
        )
      } else {
        typeormWhere[key] = condition
      }
    }

    return typeormWhere
  }

  _sanitize(str: string) {
    return str.replace(/'/g, "''")
  }
}
