// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/repository-typeorm
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  createConnection,
  Connection,
  ObjectType,
  Repository,
  getConnectionOptions,
  ConnectionOptions,
} from 'typeorm';
import { inject } from '@loopback/core';
import { DataSource } from 'loopback-datasource-juggler';
import { Filter, Entity } from '@loopback/repository';
import { AnyObject } from 'loopback-datasource-juggler';
import debug from '../util/debug'
import { escapeLiteral, buildLimit } from '../util/sql_building';

export class TypeORMDataSource extends DataSource {
  static dataSourceName = 'typeorm';

  connection: Connection;

  constructor(
    @inject('datasources.config.typeorm', { optional: true })
    public settings: Partial<ConnectionOptions> = {}
  ) { super() }

  async connect(): Promise<Connection> {
    if (this.connection) return this.connection;
    const connectionOptions = await getConnectionOptions();
    this.connection = await createConnection(
      { ...connectionOptions, ...this.settings } as ConnectionOptions
    );
    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    await this.connection.close();
  }

  async getEntityManager() {
    if (!this.connection) await this.connect();
    return this.connection.createEntityManager();
  }

  async getRepository<T>(entityClass: ObjectType<T>): Promise<Repository<T>> {
    if (!this.connection) await this.connect();
    return this.connection.getRepository(entityClass);
  }

  async refresh_materialized_views(view?: string) {
    if (!this.connection) await this.connect();
    const views = [
      'entities_key_value_counts',
      'libraries_key_value_counts',
      'libraries_signatures_key_value_counts',
      'signatures_key_value_counts',
    ]
    for (const v of views) {
      if (view === undefined || v == view) {
        await this.connection.query(`refresh materialized view "${v}";`)
      }
    }
  }

  async key_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    if (!this.connection) await this.connect();
    const table_escaped = this.connection.getMetadata(model.modelName).tableName
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, sum(r.count) as count
      from
        "${table_escaped}_key_value_counts" as r
      group by
        r.key
      ${where_meta_clause ? `
        having
          ${where_meta_clause}
      ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await this.connection.query(query, [])

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: parseInt(count)
    }), {})
  }

  async value_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    if (!this.connection) await this.connect();
    const table_escaped = this.connection.getMetadata(model.modelName).tableName
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, r.value, r.count
      from
        "${table_escaped}_key_value_counts" as r
      ${where_meta_clause ? `
        where
          ${where_meta_clause}
      ` : ''}
      order by
        r.count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await this.connection.query(query, [])

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, value, count }: any) => ({
      ...grouped,
      [key]: {
        ...grouped[key],
        [value]: parseInt(count),
      },
    }), {})
  }

  async distinct_value_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    if (!this.connection) await this.connect();
    const table_escaped = this.connection.getMetadata(model.modelName).tableName
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select distinct
        r.key, count(*) as count
      from
        "${table_escaped}_key_value_counts" as r
      group by
        r.key
      ${where_meta_clause ? `
        having
          ${where_meta_clause}
      ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await await this.connection.query(query, [])

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: parseInt(count)
    }), {})
  }
}
