import { Signature } from '../entities';
import { TypeORMDataSource } from '../datasources';
import { inject } from '@loopback/core';
import { TypeORMRepository } from './typeorm-repository';

export class SignatureRepository extends TypeORMRepository<
  Signature,
  typeof Signature.prototype.id
  >  {
  constructor(
    @inject('datasources.typeorm') dataSource: TypeORMDataSource,
  ) {
    super(Signature, dataSource);
  }
}
