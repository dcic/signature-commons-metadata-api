import { test_generic } from './generic.controller.acceptance'
import { Library } from '../../../src/models';
import { givenValidLibraryData, givenInvalidLibraryData, givenEmptyDatabase, givenLibrary } from '../helpers/database.helpers';

test_generic<Library>({
  modelName: 'library',
  basePath: '/signature-commons-metadata-api/libraries',
  givenValidObject: givenValidLibraryData,
  givenInvalidObject: givenInvalidLibraryData,
  givenValidUpdatedObject: givenValidLibraryData,
  givenInvalidUpdatedObject: givenInvalidLibraryData,
  setupDB: async () => {
    await givenEmptyDatabase()
    await givenLibrary()
  }
})
