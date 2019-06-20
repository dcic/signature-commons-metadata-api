// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Client } from '@loopback/testlab';
import { App } from '../..';
import { setupApplication } from '../helpers/application.helpers';

describe('HomePageController', () => {
  let app: App;
  let client: Client;

  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('exposes a default home page', async () => {
    await client
      .get(`${process.env.PREFIX}`)
      .expect(200)
      .expect('Content-Type', /text\/html/);
  });

  it('returns 404 errors on missing pages', async () => {
    await client
      .get('/page_that_doesnt_exist')
      .expect(404);
  });
});
