import {App} from './application';
import {ApplicationConfig} from '@loopback/core';

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

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
