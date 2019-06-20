import { authenticate } from '@loopback/authentication';
import { repository, Filter } from '@loopback/repository';
import { get, param } from '@loopback/rest';
import { Library, Signature as SignatureEntity, SignatureSchema } from '../entities';
import { LibraryRepository, SignatureRepository } from '../repositories';
import { GenericControllerFactory, IGenericRepository } from './generic.controller';

const GenericSignatureController = GenericControllerFactory<
  SignatureEntity,
  SignatureRepository
>({
  GenericRepository: SignatureRepository,
  GenericEntity: SignatureEntity,
  GenericEntitySchema: SignatureSchema,
  modelName: 'Signature',
  basePath: `${process.env.PREFIX}/signatures`,
})

export class Signature extends GenericSignatureController {
  @authenticate('GET.signatures.library')
  @get('/{id}/library')
  async getLibrary(
    @repository(LibraryRepository) libraryRepository: IGenericRepository<Library>,
    @param.path.string('id') id: string
  ): Promise<Library> {
    const signature = await this.genericRepository.findById(id, { fields: ['library'] } as Filter<SignatureEntity>)
    return await signature._library
  }
}
