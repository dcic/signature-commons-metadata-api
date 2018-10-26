import {Library, LibrarySchema} from '../models';
import {LibraryRepository} from '../repositories';
import {GenericControllerFactory} from './generic.controller'

export const LibraryController = GenericControllerFactory<
  typeof Library,
  typeof LibraryRepository
>({
  GenericModel: Library,
  GenericRepository: LibraryRepository,
  GenericModelSchema: LibrarySchema,
  modelName: 'Library',
  basePath: '/libraries',
})
