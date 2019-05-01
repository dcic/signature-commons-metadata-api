import { Entity } from '../../../src/entities';
import { givenEntity, givenInvalidEntityData, givenValidEntityData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Entity>({
  modelName: 'entity',
  basePath: '/signature-commons-metadata-api/entities',
  givenObject: givenEntity,
  givenValidObject: givenValidEntityData,
  givenInvalidObject: givenInvalidEntityData,
  givenValidUpdatedObject: givenValidEntityData,
  givenInvalidUpdatedObject: givenInvalidEntityData,
})
