import { Schema as SchemaEntity, SchemaSchema } from '../entities';
import { SchemaRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

const GenericEntityController = GenericControllerFactory<
  SchemaEntity,
  SchemaRepository
>({
  GenericRepository: SchemaRepository,
  GenericEntity: SchemaEntity,
  GenericEntitySchema: SchemaSchema,
  modelName: 'Schema',
  basePath: '/signature-commons-metadata-api/schemas',
})

export class Schema extends GenericEntityController {
}
