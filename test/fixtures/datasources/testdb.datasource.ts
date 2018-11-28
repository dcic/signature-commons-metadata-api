import { juggler } from '@loopback/repository';

export const postgresql_factory = () => {
  if (process.env['POSTGRESQL_TEST_URL'] !== undefined) {
    return new juggler.DataSource({
      name: 'PostgreSQL',
      connector: 'postgresql',
      url: process.env['POSTGRESQL_TEST_URL'],
    });
  } else {
    console.warn('POSTGRESQL_TEST_URL not provided, falling back to memory db')
    return new juggler.DataSource({
      name: 'PostgreSQL',
      connector: 'memory',
    });
  }
}

export const memory_factory = () => {
  return new juggler.DataSource({
    name: 'memory',
    connector: 'memory',
  });
}
