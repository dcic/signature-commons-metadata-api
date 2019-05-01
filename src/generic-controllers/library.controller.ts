import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { Filter } from '@loopback/repository';
import { get, getFilterSchemaFor, param, api } from '@loopback/rest';
import { Library as LibraryEntity, LibrarySchema, Signature } from '../entities';
import { LibraryRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller';
import { Signature as SignatureController } from './signature.controller';

const GenericLibraryController = GenericControllerFactory<
  LibraryEntity,
  LibraryRepository
>({
  GenericRepository: LibraryRepository,
  GenericEntity: LibraryEntity,
  GenericEntitySchema: LibrarySchema,
  modelName: 'Library',
  basePath: '/signature-commons-metadata-api/libraries',
})

export class Library extends GenericLibraryController {
  @authenticate('GET.libraries.signatures')
  @get('/{id}/signatures')
  async getSignatures(
    @inject('controllers.Signature') signatureController: SignatureController,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature)) filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str: string = '',
    @param.query.boolean('contentRange') contentRange: boolean = true,
  ): Promise<Signature[]> {
    if (filter_str !== '' && filter == null)
      filter = JSON.parse(filter_str)

    const signatures = await signatureController.find({
      filter: {
        ...(filter || {}),
        where: {
          ...((filter || {}).where || {}),
          library: id
        }
      },
      contentRange,
    })

    return signatures
  }
}
