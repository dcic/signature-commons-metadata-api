import { authenticate } from '@loopback/authentication';
import { Filter, repository } from '@loopback/repository';
import { get, param } from '@loopback/rest';
import { Library, Signature as SignatureEntity, SignatureSchema, SignatureMetaSchema } from '../models';
import { LibraryRepository, SignatureRepository } from '../repositories';
import { GenericRepository as IGenericRepository } from '../repositories/generic.repository';
import { GenericControllerFactory } from './generic.controller';

const GenericSignatureController = GenericControllerFactory<
  SignatureEntity,
  SignatureRepository
>({
  GenericRepository: SignatureRepository,
  GenericEntity: SignatureEntity,
  GenericEntitySchema: SignatureSchema,
  GenericEntityMetaSchema: SignatureMetaSchema,
  modelName: 'Signature',
  basePath: '/signature-commons-metadata-api/signatures',
})

export class Signature extends GenericSignatureController {
  @authenticate('GET.signatures.library')
  @get('/{id}/library')
  async getLibrary(
    @repository(LibraryRepository) libraryRepository: IGenericRepository<Library>,
    @param.path.string('id') id: string
  ): Promise<Library> {
    const signature = await this.genericRepository.findById(id, { fields: ['library'] } as Filter<SignatureEntity>)
    const library = await libraryRepository.findById(signature.library)
    return library
  }
}
