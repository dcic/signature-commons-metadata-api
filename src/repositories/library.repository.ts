import { inject } from '@loopback/core';
import { PostgreSQLDataSource } from '../datasources';
import { Library } from '../models';
import { GenericRepository } from './generic.repository';

export class LibraryRepository extends GenericRepository<Library> {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Library, dataSource);
  }
}
