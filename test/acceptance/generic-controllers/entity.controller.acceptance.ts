import { test_generic } from './generic.controller.acceptance'
import { Entity } from '../../../src/models';

test_generic<Entity>({
  modelName: 'entity',
  basePath: '/signature-commons-metadata-api/entities',
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
