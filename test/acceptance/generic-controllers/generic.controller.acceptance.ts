import { Client } from '@loopback/testlab';
import { App } from '../../..';
import { setupApplication } from '../helpers/application.helpers';
import { IGenericEntity } from '../../../src/generic-controllers/generic.controller';

export function test_generic<GenericEntity extends IGenericEntity>(props: {
  modelName: string
  basePath: string
  givenValidObject: () => Promise<Partial<GenericEntity>>
  givenInvalidObject: () => Promise<Partial<GenericEntity>>
  givenValidUpdatedObject: () => Promise<Partial<GenericEntity>>
  givenInvalidUpdatedObject: () => Promise<Partial<GenericEntity>>
  setupDB: () => Promise<void>
}) {
  return describe(props.modelName + 'Controller', () => {
    let app: App;
    let client: Client;
    let obj: GenericEntity

    before(props.setupDB)

    before('getData', async () => {
      obj = <GenericEntity>(await props.givenValidObject())
    })

    before('setupApplication', async () => {
      ({ app, client } = await setupApplication());
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

    it("can create valid", async () => {
      await client
        .post(props.basePath)
        .withCredentials()
        .send(await props.givenValidObject())
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    it("can't create invalid", async () => {
      await client
        .post(props.basePath)
        .send(await props.givenInvalidObject())
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateAll", async () => {
      await client
        .patch(props.basePath)
        .send([await props.givenValidUpdatedObject()])
        .withCredentials()
        .expect(200)
        .expect('Content-Type', /application\/json/);
    })

    it("can updateById", async () => {
      await client
        .patch(
          props.basePath
          + '/'
          + obj.id
        )
        .send(await props.givenValidUpdatedObject())
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
        .send(await props.givenInvalidUpdatedObject())
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll invalid", async () => {
      await client
        .put(props.basePath)
        .send([await props.givenInvalidUpdatedObject()])
        .withCredentials()
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });
  });
}
