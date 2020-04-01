import { inject } from '@loopback/context';
import { LifeCycleObserver } from '@loopback/core';
import { repository } from '@loopback/repository';
import { TypeORMDataSource } from '../datasources';
import { UserProfileRepository } from '../repositories';

export class StartupObserver implements LifeCycleObserver {
  constructor(
    @repository(UserProfileRepository) private userRepo: UserProfileRepository,
    @inject('datasources.typeorm') private typeorm: TypeORMDataSource
  ) {}

  async start() {
    console.log('[INFO]: Setting up datasource...')
    await this.typeorm.connect();

    if (process.env['ADMIN_USERNAME'] !== undefined && process.env['ADMIN_PASSWORD'] !== undefined) {
      console.log('[INFO]: Creating admin...');
      await this.userRepo.deleteAll();
      await this.userRepo.create({
        id: 'admin',
        username: process.env['ADMIN_USERNAME'],
        password: process.env['ADMIN_PASSWORD'],
        roles: '^.+$',
      });
    } else {
      console.log('[WARNING]: admin was not created')
    }

    if (process.env.REFRESH_ON_STARTUP === 'true') {
      console.log(`[INFO]: Refreshing materialized views...`);
      await this.typeorm.refresh_materialized_views()
    } else {
      console.log('[INFO]: Set REFRESH_ON_STARTUP to true if you want to keep things up to date')
    }
  }
}