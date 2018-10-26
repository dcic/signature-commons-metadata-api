import {Signature, SignatureSchema} from '../models';
import {SignatureRepository} from '../repositories';
import {GenericControllerFactory} from './generic.controller'

export const SignatureController = GenericControllerFactory<
  typeof Signature,
  typeof SignatureRepository
>({
  GenericModel: Signature,
  GenericRepository: SignatureRepository,
  GenericModelSchema: SignatureSchema,
  modelName: 'Signature',
  basePath: '/signatures',
})
