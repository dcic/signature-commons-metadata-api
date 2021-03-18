import {Signature} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class SignatureRepository extends TypeORMRepository<
  Signature,
  typeof Signature.prototype.id
> {
  dataSource: TypeORMDataSource;
  _select: string;
  relation: string;
  inverseTable: string;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(Signature, dataSource);
  }
}
