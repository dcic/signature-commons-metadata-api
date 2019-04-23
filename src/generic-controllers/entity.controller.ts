import { Entity as EntityEntity, EntitySchemas } from '../models';
import { EntityRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

const GenericEntityController = GenericControllerFactory<
  EntityEntity,
  EntityRepository
>({
  GenericRepository: EntityRepository,
  GenericEntity: EntityEntity,
  GenericSchemas: EntitySchemas,
  modelName: 'Entity',
  basePath: '/signature-commons-metadata-api/entities',
})

export class Entity extends GenericEntityController {
}
