import {DefaultCrudRepository} from '@loopback/repository';
import {Library} from '../models';
import {PostgreSQLDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class LibraryRepository extends DefaultCrudRepository<
  Library,
  typeof Library.prototype.id
> {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Library, dataSource);
  }
}
