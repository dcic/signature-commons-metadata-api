import { test_generic } from './generic.controller.acceptance'
import { Signature } from '../../../src/models';
import { givenValidSignatureData, givenInvalidSignatureData, givenEmptyDatabase, givenSignature } from '../../helpers/database.helpers';

test_generic<Signature>({
  modelName: 'signature',
  basePath: '/signature-commons-metadata-api/signatures',
  givenValidObject: givenValidSignatureData,
  givenInvalidObject: givenInvalidSignatureData,
  givenValidUpdatedObject: givenValidSignatureData,
  givenInvalidUpdatedObject: givenInvalidSignatureData,
  setupDB: async () => {
    await givenEmptyDatabase()
    await givenSignature()
  }
})
