import { Resource } from '../../../src/entities';
import { givenResource, givenInvalidResourceData, givenValidResourceData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Resource>({
  modelName: 'resource',
  basePath: '/signature-commons-metadata-api/resources',
  givenObject: givenResource,
  givenValidObject: givenValidResourceData,
  givenInvalidObject: givenInvalidResourceData,
  givenValidUpdatedObject: givenValidResourceData,
  givenInvalidUpdatedObject: givenInvalidResourceData,
})
