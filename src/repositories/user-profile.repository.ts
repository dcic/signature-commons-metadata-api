import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {UserProfile} from '../models';
import {MemoryDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class UserProfileRepository extends DefaultCrudRepository<
  UserProfile,
  typeof UserProfile.prototype.id
> {
  constructor(
    @inject('datasources.memory') dataSource: MemoryDataSource,
  ) {
    super(UserProfile, dataSource);
  }
}
