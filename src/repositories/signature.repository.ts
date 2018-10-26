import {DefaultCrudRepository} from '@loopback/repository';
import {Signature} from '../models';
import {PostgreSQLDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class SignatureRepository extends DefaultCrudRepository<
  Signature,
  typeof Signature.prototype.id
> {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Signature, dataSource);
  }
}
