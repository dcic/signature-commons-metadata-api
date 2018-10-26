import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import { makeTemplate } from '../util/dynamic-template'
import * as config from './postgre-sql.datasource.json';

export class PostgreSQLDataSource extends juggler.DataSource {
  static dataSourceName = 'PostgreSQL';

  constructor(
    @inject('datasources.config.PostgreSQL', {optional: true})
    dsConfig: any = config,
  ) {
    // Fill in variables with environment
    super(Object.keys(dsConfig).reduce(
      (args, arg: string) => ({
        ...args,
        [arg]: (typeof dsConfig[arg] === 'string') ? makeTemplate(dsConfig[arg] as string, process.env as {[key: string]: string}) : dsConfig[arg]
      }),
      {}
    ))
  }
}
