import fetch from 'node-fetch';
import { GenericEntity as IGenericEntity, GenericRepository } from '../repositories/generic.repository';

export async function getMetaSchema<
  GenericEntity extends IGenericEntity
>(
  repository: GenericRepository<GenericEntity>
) {
  const validators = await repository.validators()
  return {
    oneOf: await Promise.all(
      validators.map(
        async (validator) => await fetch(validator)
      )
    )
  }
}
