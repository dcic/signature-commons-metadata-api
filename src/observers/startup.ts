import { inject } from '@loopback/context';
import { LifeCycleObserver } from '@loopback/core';
import { repository } from '@loopback/repository';
import { SummaryController } from '../controllers/summary.controller';
import { TypeORMDataSource } from '../datasources';
import { UserProfileRepository } from '../repositories';

export class StartupObserver implements LifeCycleObserver {
  constructor(
    @repository(UserProfileRepository) private userRepo: UserProfileRepository,
    @inject('controllers.SummaryController') private summaryController: SummaryController,
    @inject('datasources.typeorm') private typeorm: TypeORMDataSource
  ) {}

  async start() {
    if (process.env['TESTING'] !== undefined) return

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
      console.log('[INFO]: Setting up datasource...')
      await this.typeorm.connect();

      console.log(`[INFO]: Refreshing materialized views...`);
      await this.typeorm.refresh_materialized_views()

      console.log(`[INFO]: Refreshing summary...`)
      await this.summaryController.refresh()
    } else {
      console.log('[INFO]: Set REFRESH_ON_STARTUP to true if you want to keep things up to date')
    }
  }
}