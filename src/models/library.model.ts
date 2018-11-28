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
  },
})
export class Library extends Entity {
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
      tsVector: 'english',
    },
    required: true,
  })
  meta: JSON;

  constructor(data?: Partial<Library>) {
    super(data);
  }
}

export const LibrarySchema = getJsonSchema(Library)
