import {App} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import {memory_db, typeorm_db} from '../helpers/database.helpers';
import {
  LibraryRepository,
  SignatureRepository,
  EntityRepository,
  UserProfileRepository,
  SchemaRepository,
  ResourceRepository,
} from '../../src/repositories';
import {DataSource} from 'loopback-datasource-juggler';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new App({
    rest: givenHttpServerConfig(),
  });

  await app.boot();
  await app.start();

  app.dataSource(await typeorm_db, 'typeorm');
  await (await app.getRepository(ResourceRepository)).init();
  await (await app.getRepository(LibraryRepository)).init();
  await (await app.getRepository(SignatureRepository)).init();
  await (await app.getRepository(EntityRepository)).init();
  await (await app.getRepository(SchemaRepository)).init();

  app.dataSource(await memory_db, 'memory');
  const memory_ds = await app.get<DataSource>('datasources.memory');
  await app.getRepository(UserProfileRepository);
  await memory_ds.autoupdate(['UserProfile']);

  const client = createRestAppClient(app);
  return {app, client};
}

export interface AppWithClient {
  app: App;
  client: Client;
}
