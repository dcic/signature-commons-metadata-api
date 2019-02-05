import { Entity as EntityEntity, EntitySchema } from '../models';
import { EntityRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'
import { api } from '@loopback/rest';

const GenericEntityController = GenericControllerFactory<
  EntityEntity,
  EntityRepository
>({
  GenericRepository: EntityRepository,
  GenericEntity: EntityEntity,
  GenericEntitySchema: EntitySchema,
  modelName: 'Entity',
  basePath: '/signature-commons-metadata-api/entities',
})

@api({
  paths: {},
  components: {
    schemas: {
      Entity: EntitySchema as any,
    },
  },
})
export class Entity extends GenericEntityController {
}
