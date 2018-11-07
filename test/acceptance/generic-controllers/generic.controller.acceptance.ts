import { Client } from '@loopback/testlab';
import { App } from '../../..';
import { setupApplication } from '../test-helper';
import { IGenericEntity } from '../../../src/generic-controllers/generic.controller';
import { AuthenticationBindings, StrategyAdapter } from '@loopback/authentication';
import { BasicStrategy } from 'passport-http';

export function test_generic<GenericEntity extends IGenericEntity>(props: {
  modelName: string
  basePath: string
  obj_valid: Partial<GenericEntity>
  obj_invalid: Partial<GenericEntity>
  obj_update_valid: Partial<GenericEntity>
  obj_update_invalid: Partial<GenericEntity>
}) {
  return describe(props.modelName + 'Controller', () => {
    let app: App;
    let client: Client;
    let obj: GenericEntity

    before('setupApplication', async () => {
      ({ app, client } = await setupApplication());

      obj = JSON.parse(
        (await client
          .post(props.basePath)
          .withCredentials()
          .send(props.obj_valid)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        ).read() as string
      ) as GenericEntity
    });

    after(async () => {
      await app.stop();
    });

    it("can count", async () => {
      await client
        .post(
          props.basePath
          + '/count'
        )
        .withCredentials()
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can key_count", async () => {
      await client
        .get(
          props.basePath
          + '/key_count'
        )
        .withCredentials()
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can dbck, and no errors", async () => {
      await client
        .get(
          props.basePath
          + '/dbck'
        )
        .withCredentials()
        .expect(200, [])
        .expect('Content-Type', /application\/json/)
    });

    it("can find", async () => {
      await client
        .get(
          props.basePath
          + '/find?filter={"where":{"id":' + obj.id + '}}'
        )
        .withCredentials()
        .expect(200, [obj])
        .expect('Content-Type', /application\/json/);
    })

    it("can findById", async () => {
      await client
        .get(
          props.basePath
          + '/' + obj.id
        )
        .withCredentials()
        .expect(200, [obj])
        .expect('Content-Type', /application\/json/);
    })

    it("can't create invalid", async () => {
      await client
        .post(props.basePath)
        .send(props.obj_invalid)
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateAll", async () => {
      await client
        .patch(props.basePath)
        .send([props.obj_update_valid])
        .withCredentials()
        .expect(200, 1)
        .expect('Content-Type', /application\/json/);
    })

    it("can updateById", async () => {
      await client
        .patch(
          props.basePath
          + '/'
          + obj.id
        )
        .send(props.obj_update_valid)
        .withCredentials()
        .expect(200)
        .expect('Content-Type', /application\/json/);
    })

    it("can't updateById invalid", async () => {
      await client
        .put(
          props.basePath
          + '/'
          + obj.id
        )
        .send(props.obj_update_invalid)
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll invalid", async () => {
      await client
        .put(props.basePath)
        .send([props.obj_update_invalid])
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });
  });
}
