import { Library } from '../entities';
import { TypeORMDataSource } from '../datasources';
import { inject } from '@loopback/core';
import { TypeORMRepository } from './typeorm-repository';

export class LibraryRepository extends TypeORMRepository<
  Library,
  typeof Library.prototype.id
  > {
  constructor(
    @inject('datasources.typeorm') dataSource: TypeORMDataSource,
  ) {
    super(Library, dataSource);
  }
}
