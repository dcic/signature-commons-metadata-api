import { juggler } from '@loopback/repository';
import { PostgreSQLDataSource } from '../../../src/datasources';

export const postgresql_factory = () => {
  if (process.env['POSTGRESQL_TEST_URL'] === undefined)
    throw new Error('POSTGRESQL_TEST_URL required')

  return new PostgreSQLDataSource({
    name: 'PostgreSQL',
    connector: 'postgresql',
    url: process.env['POSTGRESQL_TEST_URL'],
  });
}

export const memory_factory = () => {
  return new juggler.DataSource({
    name: 'memory',
    connector: 'memory',
  });
}
