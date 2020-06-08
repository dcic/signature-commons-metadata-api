import {
  Resource as ResourceEntity,
  ResourceSchema,
  Library,
  Signature,
} from '../entities';
import {ResourceRepository} from '../repositories';
import {GenericControllerFactory} from './generic.controller';
import {
  getFilterSchemaFor,
  get,
  param,
  getWhereSchemaFor,
} from '@loopback/rest';
import {Library as LibraryController} from './library.controller';
import {Signature as SignatureController} from './signature.controller';
import {Filter, Count, Where, Fields} from '@loopback/repository';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';

const GenericResourceController = GenericControllerFactory<
  ResourceEntity,
  ResourceRepository
>({
  GenericRepository: ResourceRepository,
  GenericEntity: ResourceEntity,
  GenericEntitySchema: ResourceSchema,
  modelName: 'Resource',
  basePath: `${process.env.PREFIX}/resources`,
});

export class Resource extends GenericResourceController {
  @authenticate('GET.resources.libraries')
  @get('/{id}/libraries')
  async libraries(
    @inject('controllers.Library') libraryController: LibraryController,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Library))
    filter?: Filter<Library>,
    @param.query.string('filter_str') filter_str = '',
    @param.query.boolean('contentRange') contentRange = true,
  ): Promise<Library[]> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);

    const libraries = await libraryController.find({
      filter: {
        ...(filter ?? {}),
        where: {
          ...((filter ?? {}).where ?? {}),
          resource: id,
        },
      },
      contentRange,
    });

    return libraries;
  }

  @authenticate('GET.resources.libraries.count')
  @get('/{id}/libraries/count')
  async libraries_count(
    @inject('controllers.Library') libraryController: LibraryController,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Library))
    where?: Where<Library>,
    @param.query.string('where_str') where_str = '',
  ): Promise<Count> {
    if (where_str !== '' && where == null) where = JSON.parse(where_str);

    const count = await libraryController.count({
      ...(where ?? {}),
      resource: id,
    });

    return count;
  }

  @authenticate('GET.resources.signatures')
  @get('/{id}/signatures')
  async signatures(
    @inject('controllers.Library') libraryController: LibraryController,
    @inject('controllers.Signature') signatureController: SignatureController,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature))
    filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str = '',
    @param.query.boolean('contentRange') contentRange = true,
  ): Promise<Signature[]> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    // TODO: use ORM inner join
    const libraries = await libraryController.find({
      filter: {
        where: {resource: id},
        fields: ['id'] as Fields<Library>,
      },
    });
    return signatureController.find({
      filter: {
        ...filter,
        where: {
          ...((filter ?? {}).where ?? {}),
          library: {inq: libraries.map(({id: _id}) => _id)},
        },
      },
    });
  }

  @authenticate('GET.resources.signatures.count')
  @get('/{id}/signatures/count')
  async signatures_count(
    @inject('controllers.Library') libraryController: LibraryController,
    @inject('controllers.Signature') signatureController: SignatureController,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Library))
    where?: Where<Library>,
    @param.query.string('where_str') where_str = '',
  ): Promise<Count> {
    if (where_str !== '' && where == null) where = JSON.parse(where_str);

    let count = 0;
    for (const library of await libraryController.find({
      filter: {
        where: {
          resource: id,
        },
        fields: ['id'],
      },
      contentRange: false,
    } as any)) {
      count += (
        await libraryController.signatures_count(
          signatureController,
          library.id,
          where ?? {},
        )
      ).count;
    }

    return {count};
  }
}
