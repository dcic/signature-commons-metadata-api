import {Entity, EntitySchema} from '../models';
import {EntityRepository} from '../repositories';
import {GenericControllerFactory} from './generic.controller'

export const EntityController = GenericControllerFactory<
  typeof Entity,
  typeof EntityRepository
>({
  GenericModel: Entity,
  GenericRepository: EntityRepository,
  GenericModelSchema: EntitySchema,
  modelName: 'Entity',
  basePath: '/signature-commons-metadata-api/entities',
})
