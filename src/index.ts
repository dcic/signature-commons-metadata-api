import {App} from './application';
import {ApplicationConfig} from '@loopback/core';
import {UserProfileRepository} from './repositories';
import {TypeORMDataSource} from './datasources';

export {App};

export async function main(options: ApplicationConfig = {}) {
  const app = new App({
    rest: {
      openApiSpec: {
        setServersFromRequest: true,
        endpointMapping: {
          [`${process.env.PREFIX}/openapi.json`]: {
            version: '3.0.0',
            format: 'json',
          },
          [`${process.env.PREFIX}/openapi.yml`]: {
            version: '3.0.0',
            format: 'yaml',
          },
        },
      },
      expressSettings: {
        'trust proxy': process.env.EXPRESS_TRUST_PROXY,
      },
    },
  });
  await app.boot();
  await app.start();

  if (
    process.env['ADMIN_USERNAME'] !== undefined &&
    process.env['ADMIN_PASSWORD'] !== undefined
  ) {
    const userRepo = await app.getRepository(UserProfileRepository);
    console.log('Creating admin...');
    await userRepo.deleteAll();
    await userRepo.create({
      id: 'admin',
      username: process.env['ADMIN_USERNAME'],
      password: process.env['ADMIN_PASSWORD'],
      roles: '^.+$',
    });
  }

  const typeorm = await app.get<TypeORMDataSource>('datasources.typeorm');
  await typeorm.connect();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
