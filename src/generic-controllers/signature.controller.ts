import { Signature, SignatureSchema } from '../models';
import { SignatureRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller'

export const SignatureController = GenericControllerFactory<
  Signature,
  SignatureRepository
  >({
    GenericRepository: SignatureRepository,
    GenericEntity: Signature,
    GenericEntitySchema: SignatureSchema,
    modelName: 'Signature',
    basePath: '/signature-commons-metadata-api/signatures',
  })
