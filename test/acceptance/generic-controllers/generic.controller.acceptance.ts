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

    it("can count anonymous", async () => {
      await props.givenObject()

      await client
        .get(
          props.basePath
          + '/count'
        )
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can count authenticated", async () => {
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

    it("can't key_count anonymous", async () => {
      await props.givenObject()

      await client
        .get(
          props.basePath
          + '/key_count'
        )
        .expect(401);
    });

    it("can key_count authenticated", async () => {
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

    it("can't dbck anonymous", async () => {
      await props.givenObject()
      await client
        .get(
          props.basePath
          + '/dbck'
        )
        .expect(401);
    });

    it("can dbck, and no errors authenticated", async () => {
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

    it("can find anonymous", async () => {
      const obj = await props.givenObject()

      await client
        .get(
          props.basePath
          + '?filter={"where":{"id":"' + obj.id + '"}}'
        )
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can find authenticated", async () => {
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

    it("can findById anonymous", async () => {
      const obj = await props.givenObject()

      await client
        .get(
          props.basePath
          + '/'
          + obj.id
        )
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can findById authenticated", async () => {
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

    it("can't delete anonymous", async () => {
      const obj = await props.givenObject()

      await client
        .del(
          props.basePath
          + '/'
          + obj.id
        )
        .expect(401);
    })

    it("can delete authenticated", async () => {
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

    it("can't create valid anonymous", async () => {
      const validObj = await props.givenValidObject()

      await client
        .post(props.basePath)
        .send(validObj)
        .expect(401);
    })

    it("can create valid authenticated", async () => {
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

    it("can't create invalid authenticated", async () => {
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

    it("can't updateAll valid anonymous", async () => {
      const obj = await props.givenObject()
      const validObj = await props.givenValidObject()
      validObj.id = obj.id

      await client
        .patch(props.basePath)
        .send(validObj)
        .expect(401);
    })

    it("can updateAll valid authenticated", async () => {
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

    it("can't updateAll invalid authenticated", async () => {
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

    it("can't updateById valid anonymous", async () => {
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
        .expect(401);
    })

    it("can updateById valid authenticated", async () => {
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

    it("can't updateById invalid authenticated", async () => {
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
