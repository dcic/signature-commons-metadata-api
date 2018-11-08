import { App } from '../../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
  createClientForHandler,
} from '@loopback/testlab';
import { testdb } from '../fixtures/datasources/testdb.datasource';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new App({
    rest: givenHttpServerConfig(),
  });

  await app.boot();
  await app.start();

  // Override production db with testdb
  app.dataSource(testdb, 'PostgreSQL')
  app.dataSource(testdb, 'memory')

  const client = createRestAppClient(app);

  return { app, client };
}

export interface AppWithClient {
  app: App;
  client: Client;
}
