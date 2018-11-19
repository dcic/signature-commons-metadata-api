import { Entity, model, Options, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { strict as assert } from 'assert';

@model({
  name: 'Signature',
  description: 'A single signature consisting of weighted associations of entities',
  settings: {
    postgresql: {
      table: 'signatures'
    },
    allowExtendedOperators: true,
    strict: false,
  },
})
export class Signature extends Entity {
  get $validator() {
    return '/@dcic/signature-commons-schema/core/signature.json'
  }
  set $validator(v) {
    assert.equal(v, this.$validator)
  }

  @property({
    type: 'string',
    id: true,
    required: true,
    postgresql: {
      columnName: 'uuid',
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'libid',
    },
  })
  library: string;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'json',
    },
    required: true,
    default: {},
  })
  meta: JSON;

  constructor(data?: Partial<Signature>) {
    super(data);
  }

  toObject(options?: Options): Object {
    return {
      $validator: this.$validator,
      ...super.toObject(options),
    }
  }
}
export const SignatureSchema = getJsonSchema(Signature)
