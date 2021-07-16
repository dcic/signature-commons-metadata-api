import {SignatureEntities} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class SignatureEntitiesRepository extends TypeORMRepository<
  SignatureEntities,
  typeof SignatureEntities.prototype.id
> {
  dataSource: TypeORMDataSource;
  _select: string;
  relation: string;
  inverseTable: string;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(SignatureEntities, dataSource);
  }
}
