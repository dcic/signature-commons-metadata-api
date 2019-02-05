import { juggler } from '@loopback/repository';
import { PostgreSQLDataSource } from '../../../src/datasources';

export const postgresql_factory = () => {
  if (process.env['POSTGRESQL_TEST_URL'] !== undefined) {
    return new juggler.DataSource({
      name: 'PostgreSQL',
      connector: 'postgresql',
      url: process.env['POSTGRESQL_TEST_URL'],
    }) as PostgreSQLDataSource;
  } else {
    console.warn('POSTGRESQL_TEST_URL not provided, falling back to memory db')
    return new juggler.DataSource({
      name: 'PostgreSQL',
      connector: 'memory',
    }) as PostgreSQLDataSource;
  }
}

export const memory_factory = () => {
  return new juggler.DataSource({
    name: 'memory',
    connector: 'memory',
  });
}
