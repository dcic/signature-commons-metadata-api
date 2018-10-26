import {Entity as LBEntity, model, property} from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'entities',
  description: 'Singular entities of a signature (e.g. Gene, Protein, Compound, etc..)',
})
export class Entity extends LBEntity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  id: number;

  @property({
    type: 'object',
    required: true,
    default: {},
  })
  meta: object;

  constructor(data?: Partial<Entity>) {
    super(data);
  }
}

export const EntitySchema = getJsonSchema(Entity)
