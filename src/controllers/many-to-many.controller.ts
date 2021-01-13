import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Filter} from '@loopback/repository';
import {
	api,
	get,
	getFilterSchemaFor,
	param,
  } from '@loopback/rest';
import {
	Entity as EntityController,
	Signature as SignatureController,
  } from '../generic-controllers';

import {Entity,
	Signature
} from '../entities';

@api({
	basePath: process.env.PREFIX,
	paths: {},
})
export class ManyToMany {
	@authenticate('GET.entities.signatures')
	@get('entities/{id}/signatures', {
		operationId: 'Entity.signatures',
		responses: {
			'200': {
				description:
					'Get the signatures that contains the given entity',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {'x-ts-type': Signature},
						  }
					}
				}
			}
		}
	})
	async getSignatures(
	  @inject('controllers.Signature') signatureController: SignatureController,
	  @param.path.string('id') id: string,
	  @param.query.object('filter', getFilterSchemaFor(Signature))
	  filter?: Filter<Signature>,
	  @param.query.string('filter_str') filter_str = '',
	  @param.query.boolean('contentRange') contentRange = true,    
	): Promise<Signature[]> {
	  if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
	  const signatures = await signatureController.find({
		filter: {
		  ...(filter ?? {}),
		  where: {
			...((filter ?? {}).where ?? {})
		  }
		},
		contentRange,
		join: {
		  select: "signatures.uuid as id, signatures.libid as library, signatures.meta as meta",
		  relation: "_entityset",
		  alias: "entity",
		  id
		}
	  });
  
	  return signatures;
	}

	@authenticate('GET.signatures.entities')
	@get('signatures/{id}/entities', {
		operationId: 'Signature.entities',
		responses: {
			'200': {
				description:
					'Get the entities of a signature',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {'x-ts-type': Entity},
						  }
					}
				}
			}
		}
	})
	async getEntities(
		@inject('controllers.Entity') entityController: EntityController,
		@param.path.string('id') id: string,
		@param.query.object('filter', getFilterSchemaFor(Entity))
		filter?: Filter<Entity>,
		@param.query.string('filter_str') filter_str = '',
		@param.query.boolean('contentRange') contentRange = true,
	  ): Promise<Entity[]> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
		const entities = await entityController.find({
		  filter: {
			...(filter ?? {}),
			where: {
			  ...((filter ?? {}).where ?? {})
			}
		  },
		  contentRange,
		  join: {
			select: "entities.uuid as id,  entities.meta as meta",
			relation: "_signatureset",
			alias: "signature",
			id
		  }
		});
	
		return entities;
	  }
	
}