import {Entity, model, property} from '@loopback/repository';
import { getJsonSchema } from '@loopback/rest';

@model({
  name: 'signatures',
  description: 'A single signature consisting of weighted associations of entities',
})
export class Signature extends Entity {
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
    required: true,
    default: {},
  })
  meta: object;

  constructor(data?: Partial<Signature>) {
    super(data);
  }
}
export const SignatureSchema = getJsonSchema(Signature)
