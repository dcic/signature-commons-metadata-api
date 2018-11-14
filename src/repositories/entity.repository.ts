import { DefaultCrudRepository } from '@loopback/repository';
import { Entity } from '../models';
import { PostgreSQLDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class EntityRepository extends DefaultCrudRepository<
  Entity,
  typeof Entity.prototype._id
  > {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Entity, dataSource);
  }
}
