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
  Fields,
} from '@loopback/repository';
import {
  Repository,
  FindOptionsWhereCondition,
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
import * as deepmerge from 'deepmerge'

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
      { id } as unknown as FindOptionsWhereCondition<T>,
      entity as QueryDeepPartialEntity<T>
    );
  }

  async delete(entity: DataObject<T>, options?: Options): Promise<void> {
    await this.init();
    const id = (entity as any).getId()
    if (id === undefined)
      throw new Error("Entity not found")
    await this.typeOrmRepo.delete({ id } as unknown as FindOptionsWhereCondition<T>);
  }

  async findById(id: ID, filter?: Filter, options?: Options): Promise<T> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(
      { id, select: this._columns() } as unknown as FindOptionsWhereCondition<T>
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
      { id } as unknown as FindOptionsWhereCondition<T>,
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
      { id } as unknown as FindOptionsWhereCondition<T>,
      data as QueryDeepPartialEntity<T>
    );
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    await this.init();
    await this.typeOrmRepo.delete({ id } as unknown as FindOptionsWhereCondition<T>);
  }

  async exists(id: ID, options?: Options): Promise<boolean> {
    await this.init();
    const result = await this.typeOrmRepo.findOne(
      { id } as unknown as FindOptionsWhereCondition<T>
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

    const result = await this.typeOrmRepo.createQueryBuilder('entity')
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where) as unknown as FindOptionsWhereCondition<T>)
      .orderBy(this._typeormOrder(filter.order) as any)
      .skip(filter.skip)
      .take(filter.limit)
      .getRawMany()

    return result as T[];
  }

  async updateAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.update(
      this._typeormWhere(where as Where<T>) as unknown as FindOptionsWhereCondition<T>,
      dataObject as QueryDeepPartialEntity<T>
    )
    return { count: result.generatedMaps.length };
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.delete(
      this._typeormWhere(where as Where<T>) as unknown as FindOptionsWhereCondition<T>
    )
    return { count: result.affected || -1 };
  }

  async count(where?: Where, options?: Options): Promise<Count> {
    await this.init();
    const result = await this.typeOrmRepo.count(
      this._typeormWhere(where as Where<T>) as unknown as FindOptionsWhereCondition<T>
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

  _typeormSelect(fields?: Fields<T>) {
    if (fields === undefined) return undefined
    const columns = this._columns()
    const typeormSelect = []
    const jsonQueries: { [key: string]: JSON[] } = {}

    for (const field of fields as any) {
      const m = /^(.+?)(\..+)?$/.exec(field)
      if (!m) throw 'Unhandled error'
      if (columns.indexOf(m[1]) === -1) throw 'Column does not exist'
      if (m[2]) {
        const s = m[0].split('.').map(this._sanitize)
        if (jsonQueries[this._sanitize(m[1])] === undefined)
          jsonQueries[this._sanitize(m[1])] = []
        jsonQueries[this._sanitize(m[1])].push(
          this._dotExpand(s.join('.'), this._dotToCol(m[0]))
        )
      } else {
        typeormSelect.push(
          `"entity"."${this._sanitize(m[1])}"`
        )
      }
    }

    for (const q in jsonQueries) {
      typeormSelect.push(
        `${jsonQueries[q].map((qq) => `${this._jsonToBuildObject(qq)}`).join('||')}::json as ${q}`
      )
    }

    if (typeormSelect === []) {
      return columns.map((c) => `"entity"."${c}"`)
    } else {
      return typeormSelect
    }
  }

  _jsonToBuildObject(obj: any): any {
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return `jsonb_build_array(${
          obj.map((k) => this._jsonToBuildObject(obj[k])).join(',')
          })`
      } else {
        return `jsonb_build_object(${
          Object.keys(obj).map((k) => `'${k}', ${this._jsonToBuildObject(obj[k])}`).join(',')
          })`
      }
    } else {
      return obj
    }
  }

  _typeormWhere(where?: Where<T>) {
    if (where === undefined) return {}

    const typeormWhere: { [key: string]: any } = {}
    const jsonQueries: { [key: string]: JSON } = {}

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
        //   (alias, param) => `to_tsvector('english', ${alias}) @@ plainto_tsquery('english', ${param[0]})`,
        //   condition.fullTextSearch
        // )
        typeormWhere[key] = Raw(alias =>
          `to_tsvector('english', ${alias}) @@ plainto_tsquery('english', '${this._sanitize(condition.fullTextSearch)}')`,
        )
      } else if (typeof condition === 'object') {
        // add as-is to pooled jsonQueries
        jsonQueries[key] = deepmerge(jsonQueries[key] || {}, condition)
      } else {
        const m = /^(.+?)(\.(.+))?$/.exec(key)
        if (!m) throw 'Unhandled error'
        if (m[2]) {
          // add to expanded to pooled jsonQueries
          jsonQueries[m[1]] = deepmerge(jsonQueries[m[1]] || {}, this._dotExpand(m[3], condition))
        } else {
          typeormWhere[m[1]] = condition
        }
      }
    }

    // handle any pooled JSONB queries
    for (const q in jsonQueries) {
      // Safer but not yet implemented upstream
      // typeormWhere[q] = Raw(
      //   (alias, param) => `${alias} @> ${param[0]}`,
      //   jsonQueries[q]
      // )
      typeormWhere[q] = Raw(alias =>
        `${alias} @> '${JSON.stringify(jsonQueries[q])}'::jsonb`,
      )
    }

    return typeormWhere
  }

  _typeormOrder(order?: string | string[] | { [key: string]: string }) {
    let _order
    if (order === undefined) return {}
    if (typeof order === 'string') {
      _order = [order]
    } else if (Array.isArray(order)) {
      _order = order
    } else if (typeof order === 'object') {
      _order = Object.keys(order).map((o) => `${o} ${(order as any)[o]}`)
    } else {
      throw 'Unrecognized order type'
    }

    const typeormOrder: { [key: string]: string } = {}
    for (const o of _order) {
      const m = /^(([^ ]+?)(\.[^ ]+)?)( (ASC|DESC))?$/.exec(o)
      if (!m) throw 'Unrecognized order type'
      if (m[3]) {
        console.warn('OrderBy deep fields not yet supported')
        typeormOrder[m[2]] = m[5] || 'ASC'
      } else {
        typeormOrder[m[2]] = m[5] || 'ASC'
      }
    }

    return typeormOrder
  }

  _dotExpand(key: string, deepObj: any) {
    let obj = deepObj
    const expanded = key.split('.')
    for (const k of expanded.reverse()) {
      obj = { [k]: obj }
    }
    return obj
  }

  _dotToCol(col: string) {
    const ks = col.split('.')
    if (this._columns().indexOf(ks[0]) === -1) throw 'Unrecognized column'
    return `"${ks[0]}"->${ks.slice(1).map((k) => `'${this._sanitize(k)}'`).join('->')}`
  }

  _sanitize(str: string) {
    return str.replace(/'/g, "''")
  }
}
