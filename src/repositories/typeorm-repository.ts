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
  Brackets,
} from 'typeorm';

import { TypeORMDataSource } from '../datasources'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

/**
 * An implementation of EntityCrudRepository using TypeORM
 */
export class TypeORMRepository<T extends Entity, ID extends string>
  implements EntityCrudRepository<T, ID> {
  typeOrmRepo: Repository<T>;
  tableName: string
  columns: { [colName: string]: string }

  constructor(
    public entityClass: typeof Entity & { prototype: T },
    public dataSource: TypeORMDataSource,
  ) { }

  async init() {
    if (this.typeOrmRepo != null) return;
    this.typeOrmRepo = <Repository<T>>await this.dataSource.getRepository(
      this.entityClass as any,
    );
    this.tableName = this.typeOrmRepo.metadata.tableName
    this.columns = this.typeOrmRepo.metadata.columns.reduce(
      (columns, col) => (
        col.propertyName.startsWith('_') ? columns : {
          ...columns,
          [col.propertyName]: col.databaseName
        }
      ), {}
    )
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

    const result = await this.typeOrmRepo.createQueryBuilder(this.tableName)
      .select(this._typeormSelect() as any)
      .where(`("${this.tableName}"."${this.columns['id']}" = :id)`, { id })
      .getRawOne()

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

    const result = await this.typeOrmRepo.createQueryBuilder(this.tableName)
      .select(this._typeormSelect(filter.fields) as any)
      .where(this._typeormWhere(filter.where))
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

    const result = await this.typeOrmRepo.createQueryBuilder(this.tableName)
      .update()
      .set(dataObject as QueryDeepPartialEntity<T>)
      .where(this._typeormWhere(where as any))
      .execute()

    return { count: result.generatedMaps.length };
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    await this.init();

    const result = await this.typeOrmRepo.createQueryBuilder(this.tableName)
      .delete()
      .where(this._typeormWhere(where as any))
      .execute()

    return { count: result.affected || -1 };
  }

  async count(where?: Where, options?: Options): Promise<Count> {
    await this.init();

    const result = await this.typeOrmRepo.createQueryBuilder(this.tableName)
      .where(this._typeormWhere(where as any))
      .getCount()

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


  _typeormSelect(fields?: Fields<T>) {
    if (fields === undefined) fields = [] as any

    const typeormSelect = []
    const jsonQueries: { [key: string]: JSON[] } = {}

    for (const field of fields as any) {
      const m = /^(.+?)(\..+)?$/.exec(field)
      if (!m) throw 'Unhandled error'
      if (this.columns[m[1]] === undefined) throw 'Column does not exist'
      if (m[2]) {
        const s = m[0].split('.').map(this._sanitize)
        if (jsonQueries[this._sanitize(m[1])] === undefined)
          jsonQueries[this._sanitize(m[1])] = []
        jsonQueries[this._sanitize(m[1])].push(
          this._dotExpand(s.slice(1).join('.'), this._dotToCol(m[0]))
        )
      } else {
        typeormSelect.push(
          `"${this.tableName}"."${this.columns[m[1]]}" as "${m[1]}"`
        )
      }
    }

    for (const q in jsonQueries) {
      typeormSelect.push(
        `${jsonQueries[q].map((qq) => `${this._jsonToBuildObject(qq)}`).join('||')} as ${q}`
      )
    }

    if (typeormSelect.length === 0) {
      return Object.keys(this.columns).map((c) => `"${this.tableName}"."${this.columns[c]}" as "${c}"`)
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

  _typeormWhere(where?: Where<T>, parent: string = 'and') {
    return new Brackets(qb => {
      if (where === undefined) return
      let first = true
      for (const key in where) {
        const col = this._dotToCol(key)
        const slug = this._slugify(key)
        const isJson = col.indexOf('->') !== -1
        const condition = (where as any)[key]
        if (condition.and !== undefined) {
          if (first) { qb.where(this._typeormWhere(condition.and, 'and')); first = false }
          else if (parent === 'and') qb.andWhere(this._typeormWhere(condition.and, 'and'))
          else if (parent === 'or') qb.orWhere(this._typeormWhere(condition.and, 'and'))
        } else if (condition.or !== undefined) {
          if (first) { qb.where(this._typeormWhere(condition.or, 'or')); first = false }
          else if (parent === 'and') qb.andWhere(this._typeormWhere(condition.or, 'or'))
          else if (parent === 'or') qb.orWhere(this._typeormWhere(condition.or, 'or'))
        } else if (condition.eq !== undefined) {
          if (condition.eq === null) {
            if (first) { qb.where(`${col} is null`); first = false }
            else if (parent === 'and') qb.andWhere(`${col} is null`)
            else if (parent === 'or') qb.orWhere(`${col} is null`)
          } else {
            if (first) { qb.where(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition.eq) : condition.eq }); first = false }
            else if (parent === 'and') qb.andWhere(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition.eq) : condition.eq })
            else if (parent === 'or') qb.orWhere(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition.eq) : condition.eq })
          }
        } else if (condition.neq !== undefined) {
          if (condition.neq === null) {
            if (first) { qb.where(`${col} is not null`); first = false }
            else if (parent === 'and') qb.andWhere(`${col} is not null`)
            else if (parent === 'or') qb.orWhere(`${col} is not null`)
          } else {
            if (first) { qb.where(`${col} != :${slug}`, { [slug]: isJson ? JSON.stringify(condition.neq) : condition.neq }); first = false }
            else if (parent === 'and') qb.andWhere(`${col} != :${slug}`, { [slug]: isJson ? JSON.stringify(condition.neq) : condition.neq })
            else if (parent === 'or') qb.orWhere(`${col} != :${slug}`, { [slug]: isJson ? JSON.stringify(condition.neq) : condition.neq })
          }
        } else if (condition.lt !== undefined) {
          if (first) { qb.where(`${col} < :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lt) : condition.lt }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} < :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lt) : condition.lt })
          else if (parent === 'or') qb.orWhere(`${col} < :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lt) : condition.lt })
        } else if (condition.lte !== undefined) {
          if (first) { qb.where(`${col} <= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lte) : condition.lte }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} <= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lte) : condition.lte })
          else if (parent === 'or') qb.orWhere(`${col} <= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.lte) : condition.lte })
        } else if (condition.gt !== undefined) {
          if (first) { qb.where(`${col} > :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gt) : condition.gt }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} > :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gt) : condition.gt })
          else if (parent === 'or') qb.orWhere(`${col} > :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gt) : condition.gt })
        } else if (condition.gte !== undefined) {
          if (first) { qb.where(`${col} >= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gte) : condition.gte }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} >= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gte) : condition.gte })
          else if (parent === 'or') qb.orWhere(`${col} >= :${slug}`, { [slug]: isJson ? JSON.stringify(condition.gte) : condition.gte })
        } else if (condition.inq !== undefined) {
          if (first) { qb.where(`${col} in (:...${slug})`, { [slug]: condition.inq }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} in (:...${slug})`, { [slug]: condition.inq })
          else if (parent === 'or') qb.orWhere(`${col} in (:...${slug})`, { [slug]: condition.inq })
        } else if (condition.between !== undefined) {
          if (first) { qb.where(`${col} between :${slug}0 and :${slug}1`, { [`${slug}0`]: isJson ? JSON.stringify(condition.between[0]) : condition.between[0], [`${slug}1`]: isJson ? JSON.stringify(condition.between[1]) : condition.between[1] }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} between :${slug}0 and :${slug}1`, { [`${slug}0`]: isJson ? JSON.stringify(condition.between[0]) : condition.between[0], [`${slug}1`]: isJson ? JSON.stringify(condition.between[1]) : condition.between[1] })
          else if (parent === 'or') qb.orWhere(`${col} between :${slug}0 and :${slug}1`, { [`${slug}0`]: isJson ? JSON.stringify(condition.between[0]) : condition.between[0], [`${slug}1`]: isJson ? JSON.stringify(condition.between[1]) : condition.between[1] })
        } else if (condition.fullTextSearch !== undefined) {
          if (first) { qb.where(`to_tsvector('english', ${col}) @@ plainto_tsquery('english', :${slug})`, { [slug]: condition.fullTextSearch }); first = false }
          else if (parent === 'and') qb.andWhere(`to_tsvector('english', ${col}) @@ plainto_tsquery('english', :${slug})`, { [slug]: condition.fullTextSearch })
          else if (parent === 'or') qb.orWhere(`to_tsvector('english', ${col}) @@ plainto_tsquery('english', :${slug})`, { [slug]: condition.fullTextSearch })
        } else if (typeof condition === 'object') {
          if (first) { qb.where(`${col} @> :${slug}`, { [slug]: JSON.stringify(condition) }); first = false }
          else if (parent === 'and') qb.andWhere(`${col} @> :${slug}`, { [slug]: JSON.stringify(condition) })
          else if (parent === 'or') qb.orWhere(`${col} @> :${slug}`, { [slug]: JSON.stringify(condition) })
        } else {
          if (condition === null) {
            if (first) { qb.where(`${col} is null`); first = false }
            else if (parent === 'and') qb.andWhere(`${col} is null`)
            else if (parent === 'or') qb.orWhere(`${col} is null`)
          } else {
            if (first) { qb.where(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition) : condition }); first = false }
            else if (parent === 'and') qb.andWhere(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition) : condition })
            else if (parent === 'or') qb.orWhere(`${col} = :${slug}`, { [slug]: isJson ? JSON.stringify(condition) : condition })
          }
        }
      }
    })
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
        typeormOrder[this._dotToCol(m[1])] = m[5] || 'ASC'
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
    if (this.columns[ks[0]] === undefined) throw 'Unrecognized column'
    return `"${this.tableName}"."${this.columns[ks[0]]}"${ks.length > 1 ? `->${ks.slice(1).map((k) => `'${this._sanitize(k)}'`).join('->')}` : ''}`
  }

  _slugify(str: string) {
    return str.replace(/[^a-zA-Z0-9]/g, '')
  }

  _sanitize(str: string) {
    return str.replace(/'/g, "''")
  }
}
