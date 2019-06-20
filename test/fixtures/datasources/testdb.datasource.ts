import { TypeORMDataSource, MemoryDataSource } from "../../../src/datasources";

let n = 0

export const typeorm_factory = async () => {
  if (process.env['TYPEORM_TEST_URL'] === undefined) {
    throw new Error('TYPEORM_TEST_URL required to perform tests')
  }
  const typeorm_ds = new TypeORMDataSource({
    name: `default-${n}`,
    url: process.env['TYPEORM_TEST_URL'],
  });
  n += 1
  return typeorm_ds
}

export const memory_factory = async () => {
  return new MemoryDataSource()
}
