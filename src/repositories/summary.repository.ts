import { DefaultCrudRepository } from '@loopback/repository';
import { Summary } from '../models';
import { MemoryDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class SummaryRepository extends DefaultCrudRepository<
  Summary,
  typeof Summary.prototype.id
  > {
  constructor(
    @inject('datasources.memory') dataSource: MemoryDataSource,
  ) {
    super(Summary, dataSource);
  }
}
