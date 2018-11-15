import { Entity as LBEntity, model, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { strict as assert } from 'assert'

@model({
  name: 'Entity',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
  settings: {
    postgresql: {
      table: 'entities'
    },
    allowExtendedOperators: true,
  },
})
export class Entity extends LBEntity {
  @property({
    type: 'string',
    required: true
  })
  get $validator() {
    return '/@dcic/signature-commons-schema/core/entity.json'
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
    required: true,
    postgresql: {
      dataType: 'json',
    },
    default: {},
  })
  meta: JSON;

  constructor(data?: Partial<Entity>) {
    super(data);
  }
}

export const EntitySchema = getJsonSchema(Entity)
