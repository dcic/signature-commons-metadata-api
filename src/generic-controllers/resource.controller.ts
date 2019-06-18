import { Resource as ResourceEntity, ResourceSchema, Library } from '../entities';
import { ResourceRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'
import { getFilterSchemaFor, get, param, getWhereSchemaFor } from '@loopback/rest';
import { Library as LibraryController } from './library.controller';
import { Filter, Count, Where } from '@loopback/repository';
import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';

const GenericResourceController = GenericControllerFactory<
  ResourceEntity,
  ResourceRepository
>({
  GenericRepository: ResourceRepository,
  GenericEntity: ResourceEntity,
  GenericEntitySchema: ResourceSchema,
  modelName: 'Resource',
  basePath: '/signature-commons-metadata-api/resources',
})

export class Resource extends GenericResourceController {
  @authenticate('GET.resources.libraries')
  @get('/{id}/libraries')
  async libraries(
    @inject('controllers.Library') libraryController: LibraryController,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Library)) filter?: Filter<Library>,
    @param.query.string('filter_str') filter_str: string = '',
    @param.query.boolean('contentRange') contentRange: boolean = true,
  ): Promise<Library[]> {
    if (filter_str !== '' && filter == null)
      filter = JSON.parse(filter_str)

    const libraries = await libraryController.find({
      filter: {
        ...(filter || {}),
        where: {
          ...((filter || {}).where || {}),
          resource: id
        }
      },
      contentRange,
    })

    return libraries
  }

  @authenticate('GET.resources.libraries.count')
  @get('/{id}/libraries/count')
  async libraries_count(
    @inject('controllers.Library') libraryController: LibraryController,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Library)) where?: Where<Library>,
    @param.query.string('where_str') where_str: string = '',
  ): Promise<Count> {
    if (where_str !== '' && where == null)
      where = JSON.parse(where_str)

    const count = await libraryController.count(
      {
        ...(where || {}),
        resource: id
      },
    )

    return count
  }
}
