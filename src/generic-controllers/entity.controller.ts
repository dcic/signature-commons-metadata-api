import { Entity as EntityEntity, EntitySchema } from '../entities';
import { EntityRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

const GenericEntityController = GenericControllerFactory<
  EntityEntity,
  EntityRepository
>({
  GenericRepository: EntityRepository,
  GenericEntity: EntityEntity,
  GenericEntitySchema: EntitySchema,
  modelName: 'Entity',
  basePath: `${process.env.PREFIX}/entities`,
})

export class Entity extends GenericEntityController {
}
