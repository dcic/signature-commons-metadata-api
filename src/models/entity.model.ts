import { Entity as LBEntity, model, Options, property } from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';
import { strict as assert } from 'assert';

@model({
  name: 'Entity',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
  settings: {
    postgresql: {
      table: 'entities'
    },
    allowExtendedOperators: true,
    strict: false,
  },
})
export class Entity extends LBEntity {
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

  toObject(options?: Options): Object {
    return {
      $validator: this.$validator,
      ...super.toObject(options),
    }
  }
}

export const EntitySchema = getJsonSchema(Entity)
