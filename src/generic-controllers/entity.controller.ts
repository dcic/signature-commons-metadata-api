import { Entity, EntitySchema } from '../models';
import { EntityRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

export const EntityController = GenericControllerFactory<
  Entity,
  EntityRepository
  >({
    GenericRepository: EntityRepository,
    GenericEntity: Entity,
    GenericEntitySchema: EntitySchema,
    modelName: 'Entity',
    basePath: '/signature-commons-metadata-api/entities',
  })
