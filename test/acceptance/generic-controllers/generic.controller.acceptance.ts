import { Client } from '@loopback/testlab';
import { App } from '../../..';
import { setupApplication } from '../../helpers/application.helpers';
import { IGenericEntity } from '../../../src/generic-controllers/generic.controller';
import { AuthenticationBindings, UserProfile as LbUserProfile } from '@loopback/authentication';
import { givenAdminUserProfile, givenGuestUserProfile, givenAdminUserProfileData } from '../../helpers/database.helpers';
import { UserProfile } from '../../../src/models';

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
    let user: UserProfile
    let auth: string

    before(props.setupDB)
    // before(givenGuestUserProfile)

    before('getData', async () => {
      obj = <GenericEntity>(await props.givenValidObject())
    })

    before('setupApplication', async () => {
      ({ app, client } = await setupApplication());

      user = <UserProfile>(await givenAdminUserProfileData())
      auth = Buffer.from(user.username + ':' + user.password).toString('base64')
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
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it("can key_count", async () => {
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
      await client
        .get(
          props.basePath
          + '/find?filter={"where":{"id":' + obj.id + '}}'
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can findById", async () => {
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

    it("can create valid", async () => {
      await client
        .post(props.basePath)
        .set('Authorization', 'Basic ' + auth)
        .send(await props.givenValidObject())
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    it("can't create invalid", async () => {
      await client
        .post(props.basePath)
        .send(await props.givenInvalidObject())
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateAll", async () => {
      await client
        .patch(props.basePath)
        .send([await props.givenValidUpdatedObject()])
        .set('Authorization', 'Basic ' + auth)
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
        .set('Authorization', 'Basic ' + auth)
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
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll invalid", async () => {
      await client
        .put(props.basePath)
        .send([await props.givenInvalidUpdatedObject()])
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });
  });
}
