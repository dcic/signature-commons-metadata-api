import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Library',
  description: 'Collections of related signatures',
  settings: {
    postgresql: {
      table: 'libraries'
    },
  },
})
export class Library extends Entity {
  $validator = '/@dcic/signature-commons-schema/core/entity.json'

  @property({
    type: 'number',
    id: true,
    required: true,
    postgresql: {
      columnName: 'id',
    },
  })
  _id: number;

  @property({
    type: 'string',
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
