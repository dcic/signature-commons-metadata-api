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

const schema = getJsonSchema(Signature)
export const SignatureSchema = {
  ...schema,
  properties: {
    ...schema.properties,
    meta: {
      $ref: '#/components/schemas/SignatureMeta'
    }
  }
}

export const SignatureMetaSchema = {
  oneOf: [
    { $ref: '//raw.githubusercontent.com/dcic/signature-commons-schema/master/meta/signature/draft-1.json' },
    { $ref: '//raw.githubusercontent.com/dcic/signature-commons-schema/master/core/unknown.json' },
  ],
}
