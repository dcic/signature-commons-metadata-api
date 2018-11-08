import { test_generic } from './generic.controller.acceptance'
import { Entity } from '../../../src/models';
import { givenEmptyDatabase, givenValidEntityData, givenInvalidEntityData, givenEntity } from '../../helpers/database.helpers';

test_generic<Entity>({
  modelName: 'entity',
  basePath: '/signature-commons-metadata-api/entities',
  givenValidObject: givenValidEntityData,
  givenInvalidObject: givenInvalidEntityData,
  givenValidUpdatedObject: givenValidEntityData,
  givenInvalidUpdatedObject: givenInvalidEntityData,
  setupDB: async () => {
    await givenEmptyDatabase()
    await givenEntity()
  }
})
