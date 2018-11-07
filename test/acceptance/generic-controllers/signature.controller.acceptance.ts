import { test_generic } from './generic.controller.acceptance'
import { Signature } from '../../../src/models';

test_generic<Signature>({
  modelName: 'signature',
  basePath: '/signature-commons-metadata-api/signatures',
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
