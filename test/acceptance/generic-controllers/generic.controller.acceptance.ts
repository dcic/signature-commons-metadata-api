import {Client, supertest} from '@loopback/testlab';
import {App} from '../../..';
import {IGenericEntity} from '../../../src/generic-controllers/generic.controller';
import {setupApplication} from '../../helpers/application.helpers';
import {
  givenAdminUserProfile,
  givenEmptyDatabase,
  DatabaseTestContext,
  givenDatabaseTestContext,
} from '../../helpers/database.helpers';
import debug from '../../../src/util/debug';
import assert = require('assert');

export function expect_response(obj: {
  status?: number | number[];
  body?: object;
}) {
  return (resp: supertest.Response) => {
    try {
      if (obj.status !== undefined) {
        let found = false;
        for (const status of Array.isArray(obj.status)
          ? obj.status
          : [obj.status]) {
          if (resp.status === status) {
            found = true;
            break;
          }
        }
        assert.equal(
          found,
          true,
          `${resp.status} not in ${obj.status}: ${JSON.stringify(resp.body)}`,
        );
      }
      if (obj.body !== undefined) assert.equal(resp.body, obj.body);
    } catch (e) {
      debug(resp);
      throw e;
    }
  };
}

export function test_generic<GenericEntity extends IGenericEntity>(props: {
  modelName: string;
  basePath: string;
  givenObject: (ctx: DatabaseTestContext) => Promise<GenericEntity>;
  givenValidObject: (
    ctx: DatabaseTestContext,
    obj?: Partial<GenericEntity>,
  ) => Promise<Partial<GenericEntity>>;
  givenInvalidObject: (
    ctx: DatabaseTestContext,
    obj?: Partial<GenericEntity>,
  ) => Promise<Partial<GenericEntity>>;
  givenValidUpdatedObject: (
    ctx: DatabaseTestContext,
    obj?: Partial<GenericEntity>,
  ) => Promise<Partial<GenericEntity>>;
  givenInvalidUpdatedObject: (
    ctx: DatabaseTestContext,
    obj?: Partial<GenericEntity>,
  ) => Promise<Partial<GenericEntity>>;
}) {
  return describe(props.modelName + 'Controller', () => {
    let app: App;
    let client: Client;
    let ctx: DatabaseTestContext;

    before('setupApplication', async () => {
      ({app, client} = await setupApplication());
      ctx = await givenDatabaseTestContext();
    });

    after(async () => {
      await app.stop();
    });

    beforeEach(async () => givenEmptyDatabase(ctx));

    it('can count anonymous', async () => {
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/count')
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can count authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/count')
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can key_count anonymous', async () => {
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/key_count')
        .expect(expect_response({status: 200}));
    });

    it('can key_count authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/key_count')
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can value_count anonymous', async () => {
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/value_count')
        .expect(expect_response({status: 200}));
    });

    it('can value_count authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/value_count')
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can dbck anonymous', async () => {
      await props.givenObject(ctx);
      await client
        .get(props.basePath + '/dbck')
        .expect(expect_response({status: 200}));
    });

    it('can dbck, and no errors authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      await props.givenObject(ctx);

      await client
        .get(props.basePath + '/dbck')
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect([])
        .expect('Content-Type', /application\/json/);
    });

    it('can find anonymous', async () => {
      const obj = await props.givenObject(ctx);

      await client
        .get(props.basePath + '?filter={"where":{"id":"' + obj.id + '"}}')
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can find authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);

      await client
        .get(props.basePath + '?filter={"where":{"id":"' + obj.id + '"}}')
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can findById anonymous', async () => {
      const obj = await props.givenObject(ctx);

      await client
        .get(props.basePath + '/' + obj.id)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it('can findById authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);

      await client
        .get(props.basePath + '/' + obj.id)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it("can't delete anonymous", async () => {
      const obj = await props.givenObject(ctx);

      await client
        .del(props.basePath + '/' + obj.id)
        .expect(expect_response({status: 401}));
    });

    it('can delete authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);

      await client
        .del(props.basePath + '/' + obj.id)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 204}));
    });

    it("can't create valid anonymous", async () => {
      const validObj = await props.givenValidObject(ctx);

      await client
        .post(props.basePath)
        .send(validObj)
        .expect(expect_response({status: 401}));
    });

    it('can create valid authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const validObj = await props.givenValidObject(ctx);

      await client
        .post(props.basePath)
        .set('Authorization', 'Basic ' + auth)
        .send(validObj)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it("can't create invalid authenticated", async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const invalidObj = await props.givenInvalidObject(ctx);

      await client
        .post(props.basePath)
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: [422, 406]}))
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll valid anonymous", async () => {
      const obj = await props.givenObject(ctx);
      const validObj = await props.givenValidObject(ctx);
      validObj.id = obj.id;

      await client
        .patch(props.basePath + `?where={"id": "${obj.id}"}`)
        .send(validObj)
        .expect(expect_response({status: 401}));
    });

    it('can updateAll valid authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);
      const validObj = await props.givenValidObject(ctx);
      validObj.id = obj.id;

      await client
        .patch(props.basePath + `?where={"id": "${obj.id}"}`)
        .send(validObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll invalid authenticated", async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);
      const invalidObj = await props.givenInvalidObject(ctx);
      invalidObj.id = obj.id;

      await client
        .patch(props.basePath + `?where={"id": "${obj.id}"}`)
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: [422, 406]}))
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateById valid anonymous", async () => {
      const obj = await props.givenObject(ctx);
      const validObj = await props.givenValidObject(ctx);
      validObj.id = obj.id;

      await client
        .patch(props.basePath + '/' + obj.id)
        .send(validObj)
        .expect(expect_response({status: 401}));
    });

    it('can updateById valid authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);
      const validObj = await props.givenValidObject(ctx);
      validObj.id = obj.id;

      await client
        .patch(props.basePath + '/' + obj.id)
        .send(validObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: 204}));
    });

    it("can't updateById invalid authenticated", async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const obj = await props.givenObject(ctx);
      const invalidObj = await props.givenInvalidObject(ctx);
      invalidObj.id = obj.id;

      await client
        .patch(props.basePath + '/' + obj.id)
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(expect_response({status: [422, 406]}));
    });

    it('can find_or_create valid authenticated', async () => {
      const user = await givenAdminUserProfile(ctx);
      const auth = Buffer.from(user.username + ':' + user.password).toString(
        'base64',
      );
      const validObj = await props.givenValidObject(ctx);
      const resolvedObj = {
        $validator: `/dcic/signature-commons-schema/v5/core/${props.modelName}.json`,
        ...validObj,
      };
      // If we can do this 3 times without error, then we
      //  are properly resolving the previous version and sending it back.
      await client
        .post(props.basePath + '/find_or_create')
        .set('Authorization', 'Basic ' + auth)
        .send([validObj, validObj, validObj])
        .expect(expect_response({status: 200}))
        .expect('Content-Type', /application\/json/)
        .expect([{...resolvedObj}, {...resolvedObj}, {...resolvedObj}]);
    });
  });
}
