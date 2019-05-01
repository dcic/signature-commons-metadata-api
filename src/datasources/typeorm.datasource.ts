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
}
