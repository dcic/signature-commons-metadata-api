import { Resource } from '../../../src/entities';
import { givenResource, givenInvalidResourceData, givenValidResourceData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Resource>({
  modelName: 'resource',
  basePath: `${process.env.PREFIX}/resources`,
  givenObject: givenResource,
  givenValidObject: givenValidResourceData,
  givenInvalidObject: givenInvalidResourceData,
  givenValidUpdatedObject: givenValidResourceData,
  givenInvalidUpdatedObject: givenInvalidResourceData,
})
