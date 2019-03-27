import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

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
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'dataset',
    },
  })
  dataset: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'dataset_type',
    },
  })
  dataset_type: string;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'json',
      tsVector: 'english',
    },
    required: true,
  })
  meta: JSON;

  @property({
    type: 'array',
    itemType: 'string',
    postgresql: {
      dataType: 'json',
      columnName: 'signature_keys',
    },
    required: false,
  })
  Signature_keys: JSON;

  constructor(data?: Partial<Library>) {
    super(data);
  }
}

export const LibrarySchema = getJsonSchema(Library)
