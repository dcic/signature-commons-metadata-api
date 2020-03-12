import { Entity, model, property } from '@loopback/repository';

@model({
  name: 'Summary',
  description: 'Cached summaries'
})
export class Summary extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  id: string;

  @property({
    type: 'object',
    required: false,
  })
  value: any;

  constructor(data?: Partial<Summary>) {
    super(data);
  }
}
