import { App } from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import { memory_db, typeorm_db } from '../helpers/database.helpers';
import { LibraryRepository, SignatureRepository, EntityRepository, UserProfileRepository } from '../../src/repositories';
import { DataSource } from 'loopback-datasource-juggler';
import { TypeORMDataSource } from '../../src/datasources';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new App({
    rest: givenHttpServerConfig(),
  });

  await app.boot();
  await app.start();

  app.dataSource(typeorm_db, 'typeorm')
  const typeorm_ds = await app.get<TypeORMDataSource>('datasources.typeorm')
  await typeorm_ds.connect()
  await (await app.getRepository(LibraryRepository)).init()
  await (await app.getRepository(SignatureRepository)).init()
  await (await app.getRepository(EntityRepository)).init()

  app.dataSource(memory_db, 'memory')
  const memory_ds = await app.get<DataSource>('datasources.memory')
  await app.getRepository(UserProfileRepository)
  await memory_ds.autoupdate([
    'UserProfile',
  ])

  const client = createRestAppClient(app);
  return { app, client };
}

export interface AppWithClient {
  app: App;
  client: Client;
}
