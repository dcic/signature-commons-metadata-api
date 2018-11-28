import { App } from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
  createClientForHandler,
} from '@loopback/testlab';
import { postgresql_db, memory_db } from '../helpers/database.helpers';
import { LibraryRepository, SignatureRepository, EntityRepository, UserProfileRepository } from '../../src/repositories';
import { DataSource } from 'loopback-datasource-juggler';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new App({
    rest: givenHttpServerConfig(),
  });

  await app.boot();
  await app.start();

  // Override production db with testdb
  app.dataSource(postgresql_db, 'PostgreSQL')
  const postgresql_ds = await app.get<DataSource>('datasources.PostgreSQL')
  await app.getRepository(LibraryRepository)
  await app.getRepository(SignatureRepository)
  await app.getRepository(EntityRepository)
  await postgresql_ds.automigrate([
    'Library',
    'Signature',
    'Entity',
  ])

  app.dataSource(memory_db, 'memory')
  const memory_ds = await app.get<DataSource>('datasources.memory')
  await app.getRepository(UserProfileRepository)
  await memory_ds.automigrate([
    'UserProfile',
  ])

  const client = createRestAppClient(app);
  return { app, client };
}

export interface AppWithClient {
  app: App;
  client: Client;
}
