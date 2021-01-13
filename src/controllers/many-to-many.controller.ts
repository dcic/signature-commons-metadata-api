import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
	Count,
	Filter,
	CountSchema,
	Where,
} from '@loopback/repository';
import {
	api,
	get,
	getFilterSchemaFor,
	getWhereSchemaFor,
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
	@get('/entities/{id}/signatures', {
		tags: ["Entity"],
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
	async getEntitySignatures(
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
		  id
		}
	  });
  
	  return signatures;
	}

	@authenticate('GET.signatures.entities')
	@get('/signatures/{id}/entities', {
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
			id
		  }
		});
	
		return entities;
	  }

	//   Count
	@authenticate('GET.entities.signatures.count')
	@get('/entities/{id}/signatures/count', {
		tags: ["Entity"],
		operationId: 'Entity.signatures.count',
		responses: {
		  '200': {
			description: 'Entity model signature count',
			content: {
			  'application/json': {
				schema: CountSchema,
			  },
			},
		  },
		},
	  })
	async getEntitySignaturesCount(
	  @inject('controllers.Signature') signatureController: SignatureController,
	  @param.path.string('id') id: string, 
	  @param.query.object('where', getWhereSchemaFor(Signature))
      where?: Where<Signature>,
      @param.query.string('where_str') where_str = '',
	): Promise<Count> {
		if (where_str !== '' && where === {}) where = JSON.parse(where_str);
	  	const count = await signatureController.count(
			where,
			'',
			{
				id
			}
		);
  
	  return count;
	}

	@authenticate('GET.signatures.entities.count')
	@get('/signatures/{id}/entities/count', {
		tags: ["Signature"],
		operationId: 'Signature.entities.count',
		responses: {
		  '200': {
			description: 'Signature model entity count',
			content: {
			  'application/json': {
				schema: CountSchema,
			  },
			},
		  },
		},
	  })
	async getSignatureEntitiesCount(
	  @inject('controllers.Entity') entityController: EntityController,
	  @param.path.string('id') id: string, 
	  @param.query.object('where', getWhereSchemaFor(Entity))
      where?: Where<Entity>,
      @param.query.string('where_str') where_str = '',
	): Promise<Count> {
		if (where_str !== '' && where === {}) where = JSON.parse(where_str);
	  	const count = await entityController.count(
			where,
			'',
			{
				id
			}
		);
  
	  return count;
	}

	// Value Count
	@authenticate('GET.entities.signatures.value_count')
	@get('/entities/{id}/signatures/value_count', {
		tags: ["Entity"],
		operationId: 'Entity.signatures.value_count',
		responses: {
		  '200': {
			description: 'Entity model signature value count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key-values in the database paired with the number of those key-values',
					},
				  },
				},
			  },
		  },
		},
	  })
	async getEntitySignaturesValueCount(
	  @inject('controllers.Signature') signatureController: SignatureController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Signature))
      filter?: Filter<Signature>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: {[key: string]: number}}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
	  	const value_count = await signatureController.value_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}
		);
  
	  return value_count;
	}

	@authenticate('GET.signatures.entities.value_count')
	@get('/signatures/{id}/entities/value_count', {
		tags: ["Signature"],
		operationId: 'Signature.entities.value_count',
		responses: {
		  '200': {
			description: 'Signature model entity value count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key-values in the database paired with the number of those key-values',
					},
				  },
				},
			  },
		  },
		},
	  })
	async getSignatureEntitiesValueCount(
	  @inject('controllers.Entity') entityController: EntityController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Entity))
      filter?: Filter<Entity>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: {[key: string]: number}}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
	  	const value_count = await entityController.value_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}
		);
  
	  return value_count;
	}

	// Distinct Value Count
	@authenticate('GET.entities.signatures.distinct_value_count')
	@get('/entities/{id}/signatures/distinct_value_count', {
		tags: ["Entity"],
		operationId: 'Entity.signatures.distinct_value_count',
		responses: {
		  '200': {
			description: 'Entity model signature distinct value count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key in the database paired with the number of disticting values for those keys',
					},
				  },
				},
			  }
		  },
		},
	  })
	async getEntitySignaturesDistinctValueCount(
	  @inject('controllers.Signature') signatureController: SignatureController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Signature))
      filter?: Filter<Signature>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: number}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);

		const distinct_value_count = await signatureController.distinct_value_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}  
		);
  
	  return distinct_value_count;
	}

	@authenticate('GET.signatures.entities.distinct_value_count')
	@get('/signatures/{id}/entities/distinct_value_count', {
		tags: ["Signature"],
		operationId: 'Signature.entities.distinct_value_count',
		responses: {
		  '200': {
			description: 'Signature model entity distinct value count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key in the database paired with the number of disticting values for those keys',
					},
				  },
				},
			  },
		  },
		},
	  })
	async getSignatureEntitiesDistinctValueCount(
	  @inject('controllers.Entity') entityController: EntityController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Entity))
      filter?: Filter<Entity>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: number}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
	  	const distinct_value_count = await entityController.distinct_value_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}
		);
  
	  return distinct_value_count;
	}

	// Key Count
	@authenticate('GET.entities.signatures.key_count')
	@get('/entities/{id}/signatures/key_count', {
		tags: ["Entity"],
		operationId: 'Entity.signatures.key_count',
		responses: {
		  '200': {
			description: 'Entity model signature key count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key in the database paired with the number of those keys',
					},
				  },
				},
			  },
		  },
		},
	  })
	async getEntitySignaturesKeyCount(
	  @inject('controllers.Signature') signatureController: SignatureController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Signature))
      filter?: Filter<Signature>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: number}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);

		const key_count = await signatureController.key_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}  
		);
  
	  return key_count;
	}

	@authenticate('GET.signatures.entities.key_count')
	@get('/signatures/{id}/entities/key_count', {
		tags: ["Signature"],
		operationId: 'Signature.entities.key_count',
		responses: {
		  '200': {
			description: 'Signature model entity key count',
			content: {
				'application/json': {
				  schema: {
					type: 'array',
					items: {
					  type: 'object',
					  description:
						'The key in the database paired with the number of those keys',
					},
				  },
				},
			  },
		  },
		},
	  })
	async getSignatureEntitiesKeyCount(
	  @inject('controllers.Entity') entityController: EntityController,
	  @param.path.string('id') id: string, 
	  @param.query.object('filter', getFilterSchemaFor(Entity))
      filter?: Filter<Entity>,
      @param.query.string('filter_str') filter_str = '',
	): Promise<{[key: string]: number}> {
		if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
	  	const key_count = await entityController.key_count(
			{
				...(filter ?? {}),
				where: {
					...((filter ?? {}).where ?? {})
				}
			},
			'',
			{
				id
			}
		);
  
	  return key_count;
	}

}