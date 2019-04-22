import { App } from './application';
import { ApplicationConfig } from '@loopback/core';
import { UserProfileRepository } from './repositories';

export { App };

export async function main(options: ApplicationConfig = {}) {
  const app = new App({
    rest: {
      openApiSpec: {
        setServersFromRequest: true,
        endpointMapping: {
          '/signature-commons-metadata-api/openapi.json': { version: '3.0.0', format: 'json' },
          '/signature-commons-metadata-api/openapi.yml': { version: '3.0.0', format: 'yaml' },
        },
      },
    },
  });
  await app.boot();
  await app.start();

  if (
    process.env['ADMIN_USERNAME'] !== undefined
    && process.env['ADMIN_PASSWORD'] !== undefined
  ) {
    const userRepo = await app.getRepository(UserProfileRepository)
    console.log('Creating admin...');
    await userRepo.deleteAll();
    await userRepo.create({
      id: 'admin',
      username: process.env['ADMIN_USERNAME'],
      password: process.env['ADMIN_PASSWORD'],
      roles: '^.+$',
    })
  }

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
