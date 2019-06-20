import { App } from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import { memory_db, typeorm_db, library_id_created, signature_id_created, entity_id_created, givenLibrary, givenSignature, givenEntity, givenResource, resource_id_created, givenSchema, schema_id_created } from '../helpers/database.helpers';
import { LibraryRepository, SignatureRepository, EntityRepository, UserProfileRepository, SchemaRepository, ResourceRepository } from '../../src/repositories';
import { DataSource } from 'loopback-datasource-juggler';
import { TypeORMDataSource } from '../../src/datasources';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new App({
    rest: givenHttpServerConfig(),
  });

  await app.boot();
  await app.start();

  app.dataSource(await typeorm_db, 'typeorm')
  const typeorm_ds = await app.get<TypeORMDataSource>('datasources.typeorm')
  await typeorm_ds.connect()
  await typeorm_ds.connection.synchronize(true)
  await typeorm_ds.connection.runMigrations()
  await (await app.getRepository(ResourceRepository)).init()
  await (await app.getRepository(LibraryRepository)).init()
  await (await app.getRepository(SignatureRepository)).init()
  await (await app.getRepository(EntityRepository)).init()
  await (await app.getRepository(SchemaRepository)).init()

  await givenResource({ id: resource_id_created });
  await givenLibrary({ id: library_id_created });
  await givenSignature({ id: signature_id_created });
  await givenEntity({ id: entity_id_created });
  await givenSchema({ id: schema_id_created });

  app.dataSource(await memory_db, 'memory')
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
