import { Client } from '@loopback/testlab';
import { App } from '../../..';
import { setupApplication } from '../../helpers/application.helpers';
import { IGenericEntity } from '../../../src/generic-controllers/generic.controller';
import { AuthenticationBindings, UserProfile as LbUserProfile } from '@loopback/authentication';
import { givenAdminUserProfile, givenAdminUserProfileData } from '../../helpers/database.helpers';
import { UserProfile } from '../../../src/models';

export function test_generic<GenericEntity extends IGenericEntity>(props: {
  modelName: string
  basePath: string
  givenValidObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenInvalidObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenValidUpdatedObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  givenInvalidUpdatedObject: (obj?: Partial<GenericEntity>) => Promise<Partial<GenericEntity>>
  setupDB: () => Promise<void>
}) {
  return describe(props.modelName + 'Controller', () => {
    let app: App;
    let client: Client;
    let obj: GenericEntity
    let user: UserProfile
    let auth: string

    beforeEach(props.setupDB)
    // before(givenGuestUserProfile)

    before('getData', async () => {
      obj = <GenericEntity>(await props.givenValidObject(<object>{
        $validator: '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json',
      }))
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
        .get(
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
          + '?filter={"where":{"id":"' + obj.id + '"}}'
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
          + obj._id
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can delete", async () => {
      await client
        .delete(
          props.basePath
          + '/'
          + obj._id
        )
        .set('Authorization', 'Basic ' + auth)
        .expect(200/*, [obj]*/)
        .expect('Content-Type', /application\/json/);
    })

    it("can create valid", async () => {
      await client
        .post(props.basePath)
        .set('Authorization', 'Basic ' + auth)
        .send(await props.givenValidObject(<object>{
          $validator: '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json',
        }))
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    it("can't create invalid", async () => {
      await client
        .post(props.basePath)
        .send(await props.givenInvalidObject(<object>{
          $validator: '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json',
        }))
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can updateAll", async () => {
      await client
        .patch(props.basePath)
        .send([await props.givenValidUpdatedObject(<object>{
          $validator: '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json',
        })])
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    })

    it("can updateById", async () => {
      await client
        .patch(
          props.basePath
          + '/'
          + obj._id
        )
        .send(await props.givenValidUpdatedObject())
        .set('Authorization', 'Basic ' + auth)
        .expect(200)
        .expect('Content-Type', /application\/json/);
    })

    it("can't updateById invalid", async () => {
      await client
        .patch(
          props.basePath
          + '/'
          + obj._id
        )
        .send(await props.givenInvalidUpdatedObject(<object>{
          $validator: '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json',
        }))
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });

    it("can't updateAll invalid", async () => {
      await client
        .patch(props.basePath)
        .send([await props.givenInvalidUpdatedObject()])
        .set('Authorization', 'Basic ' + auth)
        .expect(406)
        .expect('Content-Type', /application\/json/);
    });
  });
}
