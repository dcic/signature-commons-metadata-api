import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Signature',
  description: 'A single signature consisting of weighted associations of entities',
  settings: {
    postgresql: {
      table: 'signatures'
    },
    allowExtendedOperators: true,
  },
})
export class Signature extends Entity {
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
      tsVector: 'english',
    },
    required: true,
    default: {},
  })
  meta: JSON;

  constructor(data?: Partial<Signature>) {
    super(data);
  }
}
export const SignatureSchema = getJsonSchema(Signature)
