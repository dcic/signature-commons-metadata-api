import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'Entity',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
  settings: {
    postgresql: {
      table: 'entities'
    },
    allowExtendedOperators: true,
  }
})
export class Entity extends LBEntity {
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
    required: true,
    postgresql: {
      dataType: 'json',
      tsVector: 'english',
    },
    default: {},
  })
  meta: JSON;

  constructor(data?: Partial<Entity>) {
    super(data);
  }
}

const schema = getJsonSchema(Entity)
export const EntitySchema = {
  ...schema,
  properties: {
    ...schema.properties,
    meta: {
      $ref: '#/components/schemas/EntityMeta',
    },
  }
}

export const EntityMetaSchema = {
  oneOf: [
    { $ref: '//raw.githubusercontent.com/dcic/signature-commons-schema/master/meta/entity/draft-1.json' },
    { $ref: '//raw.githubusercontent.com/dcic/signature-commons-schema/master/core/unknown.json' }
  ],
}
