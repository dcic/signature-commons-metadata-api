import {Schema} from '../../../src/entities';
import {
  givenSchema,
  givenInvalidSchemaData,
  givenValidSchemaData,
} from '../../helpers/database.helpers';
import {test_generic} from './generic.controller.acceptance';

test_generic<Schema>({
  modelName: 'schema',
  basePath: `${process.env.PREFIX}/schemas`,
  givenObject: givenSchema,
  givenValidObject: givenValidSchemaData,
  givenInvalidObject: givenInvalidSchemaData,
  givenValidUpdatedObject: givenValidSchemaData,
  givenInvalidUpdatedObject: givenInvalidSchemaData,
});
