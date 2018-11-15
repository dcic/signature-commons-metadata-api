import { Client } from '@loopback/testlab';
import { App } from '../../..';
import { IGenericEntity } from '../../../src/generic-controllers/generic.controller';
import { setupApplication } from '../../helpers/application.helpers';
import { givenAdminUserProfile, givenEmptyDatabase } from '../../helpers/database.helpers';

export function test_generic<GenericEntity extends IGenericEntity>(props: {
  modelName: string
  basePath: string
  givenObject: () => Promise<GenericEntity>
  givenValidObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenInvalidObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenValidUpdatedObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenInvalidUpdatedObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
}) {
  return describe(props.modelName + 'Controller', () => {
    let app: App;
    let client: Client;

    beforeEach(givenEmptyDatabase)

    before('setupApplication', async () => {
      ({ app, client } = await setupApplication());
    });

    after(async () => {
      await app.stop();
    });

    it("can count", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      await props.givenObject()

      await client
        .get(
          props.basePath
          + '/count'
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can key_count", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      await props.givenObject()

      await client
        .get(
          props.basePath
          + '/key_count'
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can dbck, and no errors", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      await props.givenObject()

      await client
        .get(
          props.basePath
          + '/dbck'
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200, [])
        .expect('Content-Type', /application\/json/)
    });

    it("can find", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()

      await client
        .get(
          props.basePath
          + '?filter={"where":{"id":"' + obj.id + '"}}'
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can findById", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()

      await client
        .get(
          props.basePath
          + '/'
          + obj.id
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can delete", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()

      await client
        .del(
          props.basePath
          + '/'
          + obj.id
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(204);
    })

    it("can create valid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const validObj = await props.givenValidObject()

      await client
        .post(props.basePath)
        .set('Authorization', 'Basic ' + auth)
        .send(validObj)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    it("can't create invalid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const invalidObj = await props.givenInvalidObject()

      await client
        .post(props.basePath)
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateAll valid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()
      const validObj = await props.givenValidObject()
      validObj.id = obj.id

      await client
        .patch(props.basePath)
        .send(validObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    })

    it("can't updateAll invalid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()
      const invalidObj = await props.givenInvalidObject()
      invalidObj.id = obj.id

      await client
        .patch(props.basePath)
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateById valid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()
      const validObj = await props.givenValidObject()
      validObj.id = obj.id

      await client
        .patch(
          props.basePath
          + '/'
          + obj.id
        )
        .send(validObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(204);
    })

    it("can't updateById invalid", async () => {
      const user = await givenAdminUserProfile()
      const auth = Buffer.from(user.username + ':' + user.password).toString('base64')
      const obj = await props.givenObject()
      const invalidObj = await props.givenInvalidObject()
      invalidObj.id = obj.id

      await client
        .patch(
          props.basePath
          + '/'
          + obj.id
        )
        .send(invalidObj)
        .set('Authorization', 'Basic ' + auth)
        .expect(406);
    });
  });
}
