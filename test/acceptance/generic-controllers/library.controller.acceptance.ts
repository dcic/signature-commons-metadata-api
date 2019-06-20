import { Library } from '../../../src/entities';
import { givenInvalidLibraryData, givenLibrary, givenValidLibraryData } from '../../helpers/database.helpers';
import { test_generic } from './generic.controller.acceptance';

test_generic<Library>({
  modelName: 'library',
  basePath: `${process.env.PREFIX}/libraries`,
  givenObject: givenLibrary,
  givenValidObject: givenValidLibraryData,
  givenInvalidObject: givenInvalidLibraryData,
  givenValidUpdatedObject: givenValidLibraryData,
  givenInvalidUpdatedObject: givenInvalidLibraryData,
})
