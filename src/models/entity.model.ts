import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema, SchemasObject, SchemaObject } from '@loopback/rest';

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

const schema = getJsonSchema(Entity) as SchemaObject
export const EntitySchemas: SchemasObject = {
  Entity: {
    ...schema,
    properties: {
      ...schema.properties,
      meta: require('@dcic/signature-commons-schema/meta/entity/draft-1.json'),
    }
  },
  Meta: require('@dcic/signature-commons-schema/core/meta.json'),
}
