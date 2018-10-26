import {App} from './application';
import {ApplicationConfig} from '@loopback/core';

export {App};

export async function main(options: ApplicationConfig = {}) {
  const app = new App({
    rest: {
      openApiSpec: {
        endpointMapping: {
          '/signature-commons-metadata-api/openapi.json': {version: '3.0.0', format: 'json'},
          '/signature-commons-metadata-api/openapi.yml': {version: '3.0.0', format: 'yaml'},
        },
      },
    },
  });
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
