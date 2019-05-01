import { TypeORMDataSource, MemoryDataSource } from "../../../src/datasources";

let n = 0

export const typeorm_factory = () => {
  if (process.env['POSTGRESQL_TEST_URL'] === undefined) {
    throw new Error('POSTGRESQL_TEST_URL required to perform tests')
  }
  const typeorm_ds = new TypeORMDataSource({
    name: `default-${n}`,
    url: process.env['POSTGRESQL_TEST_URL'],
  });
  n += 1
  return typeorm_ds
}

export const memory_factory = () => {
  return new MemoryDataSource()
}
