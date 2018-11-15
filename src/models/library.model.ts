import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { strict as assert } from 'assert'

@model({
  name: 'Library',
  description: 'Collections of related signatures',
  settings: {
    postgresql: {
      table: 'libraries'
    },
    allowExtendedOperators: true,
  },
})
export class Library extends Entity {
  @property({
    type: 'string',
    required: true
  })
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
}

export const LibrarySchema = getJsonSchema(Library)
