import { inject } from '@loopback/core';
import { PostgreSQLDataSource } from '../datasources';
import { Signature } from '../models';
import { GenericRepository } from './generic.repository';

export class SignatureRepository extends GenericRepository<Signature> {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Signature, dataSource);
  }
}
