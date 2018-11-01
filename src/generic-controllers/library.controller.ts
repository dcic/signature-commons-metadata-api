import { Library, LibrarySchema } from '../models';
import { LibraryRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

export const LibraryController = GenericControllerFactory<
  Library,
  LibraryRepository
  >({
    GenericRepository: LibraryRepository,
    GenericEntity: Library,
    GenericEntitySchema: LibrarySchema,
    modelName: 'Library',
    basePath: '/signature-commons-metadata-api/libraries',
  })
