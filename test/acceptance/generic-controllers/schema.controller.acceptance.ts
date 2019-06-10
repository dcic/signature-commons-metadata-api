import { Schema } from '../../../src/entities';
import { givenSchema, givenInvalidSchemaData, givenValidSchemaData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Schema>({
  modelName: 'schema',
  basePath: '/signature-commons-metadata-api/schemas',
  givenObject: givenSchema,
  givenValidObject: givenValidSchemaData,
  givenInvalidObject: givenInvalidSchemaData,
  givenValidUpdatedObject: givenValidSchemaData,
  givenInvalidUpdatedObject: givenInvalidSchemaData,
})
