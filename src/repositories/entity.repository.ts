import { Entity } from '../entities';
import { TypeORMDataSource } from '../datasources';
import { inject } from '@loopback/core';
import { TypeORMRepository } from './typeorm-repository';

export class EntityRepository extends TypeORMRepository<
  Entity,
  typeof Entity.prototype.id
  > {
  constructor(
    @inject('datasources.typeorm') dataSource: TypeORMDataSource,
  ) {
    super(Entity, dataSource);
  }
}
