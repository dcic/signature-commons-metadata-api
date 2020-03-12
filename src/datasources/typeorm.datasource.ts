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
import {inject} from '@loopback/core';
import {DataSource} from 'loopback-datasource-juggler';
import {Filter, Entity} from '@loopback/repository';
import {AnyObject} from 'loopback-datasource-juggler';
import debug from '../util/debug';
import {escapeLiteral, buildLimit} from '../util/sql_building';

export class TypeORMDataSource extends DataSource {
  static dataSourceName = 'typeorm';

  private _connection?: Connection;

  constructor(
    @inject('datasources.config.typeorm', {optional: true})
    public settings: Partial<ConnectionOptions> = {},
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this._connection !== undefined) return;
    const connectionOptions = {
      ...(await getConnectionOptions()),
      ...this.settings,
    } as ConnectionOptions;
    this._connection = await createConnection({
      ...connectionOptions,
      synchronize: false,
      migrationsRun: false,
    });
    if (this._connection === undefined) {
      throw new Error(
        `Database connection failed: ${JSON.stringify(connectionOptions)}`,
      );
    } else {
      if (connectionOptions.synchronize === true) {
        debug('Synchronizing database...');
        await this._connection.synchronize(false);
      }
      if (connectionOptions.migrationsRun === true) {
        debug('Running any pending migrations...');
        await this._connection.runMigrations({transaction: 'all'});
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this._connection === undefined) return;
    await this._connection.close();
    this._connection = undefined;
  }

  async getConnection(): Promise<Connection> {
    if (this._connection === undefined) await this.connect();
    return this._connection as Connection;
  }

  async getEntityManager() {
    return (await this.getConnection()).createEntityManager();
  }

  async getRepository<T>(entityClass: ObjectType<T>): Promise<Repository<T>> {
    return (await this.getConnection()).getRepository(entityClass);
  }

  async refresh_materialized_views(view?: string) {
    const views = [
      'entities_key_value_counts',
      'libraries_key_value_counts',
      'libraries_signatures_key_value_counts',
      'signatures_key_value_counts',
    ];
    for (const v of views) {
      if (view === undefined || v === view) {
        await (await this.getConnection()).query(
          `refresh materialized view "${v}";`,
        );
      }
    }
  }

  async key_counts<TE extends typeof Entity, E extends Entity>(
    model: TE,
    filter?: Filter<E>,
  ): Promise<{[key: string]: number}> {
    const table_escaped = (await this.getConnection()).getMetadata(
      model.modelName,
    ).tableName;
    const filter_fields = ((filter ?? {}).fields ?? []) as string[];
    const where_meta_clause =
      filter_fields.length <= 0
        ? ''
        : filter_fields
            .map(
              field =>
                `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(
                  field,
                )} || '.%'`,
            )
            .join(' or ');
    const pagination_clause = buildLimit(
      (filter ?? {}).limit,
      (filter ?? {}).offset ?? (filter ?? {}).skip,
    );

    const query = `
      select
        r.key, sum(r.count) as count
      from
        "${table_escaped}_key_value_counts" as r
      group by
        r.key
      ${
        where_meta_clause
          ? `
        having
          ${where_meta_clause}
      `
          : ''
      }
      order by
        count desc
      ${pagination_clause}
      ;
    `;
    debug(query);

    const results = await (await this.getConnection()).query(query, []);

    return (results as AnyObject[]).reduce<{[key: string]: number}>(
      (grouped: any, {key, count}: any) => ({
        ...grouped,
        [key]: parseInt(count),
      }),
      {},
    );
  }

  async value_counts<TE extends typeof Entity, E extends Entity>(
    model: TE,
    filter?: Filter<E>,
  ): Promise<{[key: string]: {[key: string]: number}}> {
    const table_escaped = (await this.getConnection()).getMetadata(
      model.modelName,
    ).tableName;
    const filter_fields = ((filter ?? {}).fields ?? []) as string[];
    const where_meta_clause =
      filter_fields.length <= 0
        ? ''
        : filter_fields
            .map(
              field =>
                `r.key = ${escapeLiteral(
                  field === 'library' ? 'libid' : field,
                )} or r.key like ${escapeLiteral(
                  field === 'library' ? 'libid' : field,
                )} || '.%'`,
            )
            .join(' or ');
    const pagination_clause = buildLimit(
      (filter ?? {}).limit,
      (filter ?? {}).offset ?? (filter ?? {}).skip,
    );

    const query = `
      select
        r.key, r.value, r.count
      from
        "${table_escaped}_key_value_counts" as r
      ${
        where_meta_clause
          ? `
        where
          ${where_meta_clause}
      `
          : ''
      }
      order by
        r.count desc
      ${pagination_clause}
      ;
    `;
    debug(query);

    const results = await (await this.getConnection()).query(query, []);

    return (results as AnyObject[]).reduce<{
      [key: string]: {[key: string]: number};
    }>(
      (grouped: any, {key, value, count}: any) => ({
        ...grouped,
        [key === 'libid' ? 'library' : key]: {
          ...grouped[key === 'libid' ? 'library' : key],
          [value]: parseInt(count),
        },
      }),
      {},
    );
  }

  async distinct_value_counts<TE extends typeof Entity, E extends Entity>(
    model: TE,
    filter?: Filter<E>,
  ): Promise<{[key: string]: number}> {
    const table_escaped = (await this.getConnection()).getMetadata(
      model.modelName,
    ).tableName;
    const filter_fields = ((filter ?? {}).fields ?? []) as string[];
    const where_meta_clause =
      filter_fields.length <= 0
        ? ''
        : filter_fields
            .map(
              field =>
                `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(
                  field,
                )} || '.%'`,
            )
            .join(' or ');
    const pagination_clause = buildLimit(
      (filter ?? {}).limit,
      (filter ?? {}).offset ?? (filter ?? {}).skip,
    );

    const query = `
      select distinct
        r.key, count(*) as count
      from
        "${table_escaped}_key_value_counts" as r
      group by
        r.key
      ${
        where_meta_clause
          ? `
        having
          ${where_meta_clause}
      `
          : ''
      }
      order by
        count desc
      ${pagination_clause}
      ;
    `;
    debug(query);

    const results = await await (await this.getConnection()).query(query, []);

    return (results as AnyObject[]).reduce<{[key: string]: number}>(
      (grouped: any, {key, count}: any) => ({
        ...grouped,
        [key]: parseInt(count),
      }),
      {},
    );
  }
}
