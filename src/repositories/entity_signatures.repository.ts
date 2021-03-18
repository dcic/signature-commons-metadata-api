import {EntitySignatures} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class EntitySignaturesRepository extends TypeORMRepository<
  EntitySignatures,
  typeof EntitySignatures.prototype.id
> {
  dataSource: TypeORMDataSource;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(EntitySignatures, dataSource);
  }
}
