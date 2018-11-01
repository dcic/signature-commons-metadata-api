import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'libraries',
  description: 'Collections of related signatures',
})
export class Library extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  uuid: string;

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
