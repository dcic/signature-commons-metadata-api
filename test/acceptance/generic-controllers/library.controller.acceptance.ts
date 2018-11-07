import { test_generic } from './generic.controller.acceptance'
import { Library } from '../../../src/models';

test_generic<Library>({
  modelName: 'library',
  basePath: '/signature-commons-metadata-api/libraries',
  obj_valid: {
    meta: <JSON>{}
  },
  obj_update_valid: {
    meta: <JSON>{}
  },
  obj_invalid: {
    meta: <JSON>{}
  },
  obj_update_invalid: {
    meta: <JSON>{}
  },
})
