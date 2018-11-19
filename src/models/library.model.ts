import { Entity, model, Options, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { strict as assert } from 'assert';

@model({
  name: 'Library',
  description: 'Collections of related signatures',
  settings: {
    postgresql: {
      table: 'libraries'
    },
    allowExtendedOperators: true,
    strict: false,
  },
})
export class Library extends Entity {
  get $validator() {
    return '/@dcic/signature-commons-schema/core/library.json'
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
    type: 'object',
    postgresql: {
      dataType: 'json',
    },
    required: true,
  })
  meta: JSON;

  constructor(data?: Partial<Library>) {
    super(data);
  }

  toObject(options?: Options): Object {
    return {
      $validator: this.$validator,
      ...super.toObject(options),
    }
  }
}

export const LibrarySchema = getJsonSchema(Library)
