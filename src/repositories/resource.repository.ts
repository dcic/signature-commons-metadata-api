import {Resource} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class ResourceRepository extends TypeORMRepository<
  Resource,
  typeof Resource.prototype.id
> {
  dataSource: TypeORMDataSource;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(Resource, dataSource);
  }
}
