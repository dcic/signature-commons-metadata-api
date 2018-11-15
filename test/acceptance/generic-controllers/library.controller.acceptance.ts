import { Library } from '../../../src/models';
import { givenInvalidLibraryData, givenLibrary, givenValidLibraryData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Library>({
  modelName: 'library',
  basePath: '/signature-commons-metadata-api/libraries',
  givenObject: givenLibrary,
  givenValidObject: givenValidLibraryData,
  givenInvalidObject: givenInvalidLibraryData,
  givenValidUpdatedObject: givenValidLibraryData,
  givenInvalidUpdatedObject: givenInvalidLibraryData,
})
