import {Schema} from '../entities';
import {TypeORMDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TypeORMRepository} from './typeorm-repository';

export class SchemaRepository extends TypeORMRepository<
  Schema,
  typeof Schema.prototype.id
> {
  dataSource: TypeORMDataSource;

  constructor(@inject('datasources.typeorm') dataSource: TypeORMDataSource) {
    super(Schema, dataSource);
  }
}
