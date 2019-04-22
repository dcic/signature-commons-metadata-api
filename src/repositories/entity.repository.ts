import { inject } from '@loopback/core';
import { PostgreSQLDataSource } from '../datasources';
import { Entity } from '../models';
import { GenericRepository } from './generic.repository';

export class EntityRepository extends GenericRepository<Entity> {
  constructor(
    @inject('datasources.PostgreSQL') dataSource: PostgreSQLDataSource,
  ) {
    super(Entity, dataSource);
  }
}
