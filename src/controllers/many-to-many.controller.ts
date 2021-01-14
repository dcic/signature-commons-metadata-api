import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  repository,
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
  Response,
  RestBindings,
} from '@loopback/rest';

import {prune} from '../generic-controllers/generic.controller';

import {EntityRepository, SignatureRepository} from '../repositories';

import {applyFieldsFilter} from '../util/applyFieldsFilter';

import {Entity, Signature} from '../entities';
import {UserProfile} from '../models';

@api({
  basePath: process.env.PREFIX,
  paths: {},
})
export class ManyToMany {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, {optional: true})
    private response: Response,
  ) {}

  @authenticate('GET.entities.signatures')
  @get('/entities/{id}/signatures', {
    tags: ['Entity'],
    operationId: 'Entity.signatures',
    responses: {
      '200': {
        description: 'Get the signatures that contains the given entity',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {'x-ts-type': Signature},
            },
          },
        },
      },
    },
  })
  async getEntitySignatures(
    @repository(SignatureRepository)
    signatureRepository: SignatureRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature))
    filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str = '',
    @param.query.boolean('contentRange') contentRange = true,
  ): Promise<Signature[]> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const results = await signatureRepository.find_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });
    if (contentRange !== false && this.response !== undefined) {
      if (filter === undefined) filter = {};
      let count: number;
      if (filter.limit === undefined)
        count = results.length + (filter.skip ?? filter.offset ?? 0);
      else
        count = (await signatureRepository.count_through(id, filter.where))
          .count;

      const start: number = filter.skip ?? filter.offset ?? 0;
      const end = Math.min(start + (filter.limit ?? Infinity), count);

      this.response.setHeader(
        'Access-Control-Expose-Headers',
        [...this.response.getHeaderNames(), 'Content-Range'].join(','),
      );
      this.response.setHeader('Content-Range', `${start}-${end}/${count}`);
    }
    return results.map(obj =>
      applyFieldsFilter(
        {
          $validator: '/dcic/signature-commons-schema/v5/core/signature.json',
          ...(<any>prune(obj)),
        },
        (filter ?? {}).fields ?? [],
      ),
    );
  }

  @authenticate('GET.signatures.entities')
  @get('/signatures/{id}/entities', {
    operationId: 'Signature.entities',
    responses: {
      '200': {
        description: 'Get the entities of a signature',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {'x-ts-type': Entity},
            },
          },
        },
      },
    },
  })
  async getSignatureEntities(
    @repository(EntityRepository)
    entityRepository: EntityRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Entity))
    filter?: Filter<Entity>,
    @param.query.string('filter_str') filter_str = '',
    @param.query.boolean('contentRange') contentRange = true,
  ): Promise<Entity[]> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const results = await entityRepository.find_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });
    if (contentRange !== false && this.response !== undefined) {
      if (filter === undefined) filter = {};
      let count: number;
      if (filter.limit === undefined)
        count = results.length + (filter.skip ?? filter.offset ?? 0);
      else
        count = (await entityRepository.count_through(id, filter.where)).count;

      const start: number = filter.skip ?? filter.offset ?? 0;
      const end = Math.min(start + (filter.limit ?? Infinity), count);

      this.response.setHeader(
        'Access-Control-Expose-Headers',
        [...this.response.getHeaderNames(), 'Content-Range'].join(','),
      );
      this.response.setHeader('Content-Range', `${start}-${end}/${count}`);
    }
    return results.map(obj =>
      applyFieldsFilter(
        {
          $validator: '/dcic/signature-commons-schema/v5/core/entity.json',
          ...(<any>prune(obj)),
        },
        (filter ?? {}).fields ?? [],
      ),
    );
  }

  //   Count
  @authenticate('GET.entities.signatures.count')
  @get('/entities/{id}/signatures/count', {
    tags: ['Entity'],
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
    @repository(SignatureRepository)
    signatureRepository: SignatureRepository,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Signature))
    where?: Where<Signature>,
    @param.query.string('where_str') where_str = '',
  ): Promise<Count> {
    if (where_str !== '' && where === {}) where = JSON.parse(where_str);
    const count = await signatureRepository.count_through(id, where);

    return count;
  }

  @authenticate('GET.signatures.entities.count')
  @get('/signatures/{id}/entities/count', {
    tags: ['Signature'],
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
    @repository(EntityRepository)
    entityRepository: EntityRepository,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Entity))
    where?: Where<Entity>,
    @param.query.string('where_str') where_str = '',
  ): Promise<Count> {
    if (where_str !== '' && where === {}) where = JSON.parse(where_str);
    const count = await entityRepository.count_through(id, where);

    return count;
  }

  // Value Count
  @authenticate('GET.entities.signatures.value_count')
  @get('/entities/{id}/signatures/value_count', {
    tags: ['Entity'],
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
    @repository(SignatureRepository)
    signatureRepository: SignatureRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature))
    filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: {[key: string]: number}}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const value_count = await signatureRepository.value_counts_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });

    return value_count;
  }

  @authenticate('GET.signatures.entities.value_count')
  @get('/signatures/{id}/entities/value_count', {
    tags: ['Signature'],
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
    @repository(EntityRepository)
    entityRepository: EntityRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Entity))
    filter?: Filter<Entity>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: {[key: string]: number}}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const value_count = await entityRepository.value_counts_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });

    return value_count;
  }

  // Distinct Value Count
  @authenticate('GET.entities.signatures.distinct_value_count')
  @get('/entities/{id}/signatures/distinct_value_count', {
    tags: ['Entity'],
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
        },
      },
    },
  })
  async getEntitySignaturesDistinctValueCount(
    @repository(SignatureRepository)
    signatureRepository: SignatureRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature))
    filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: number}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);

    const distinct_value_count = await signatureRepository.distinct_value_counts_through(
      id,
      {
        ...(filter ?? {}),
        where: {
          ...((filter ?? {}).where ?? {}),
        },
      },
    );

    return distinct_value_count;
  }

  @authenticate('GET.signatures.entities.distinct_value_count')
  @get('/signatures/{id}/entities/distinct_value_count', {
    tags: ['Signature'],
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
    @repository(EntityRepository)
    entityRepository: EntityRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Entity))
    filter?: Filter<Entity>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: number}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const distinct_value_count = await entityRepository.distinct_value_counts_through(
      id,
      {
        ...(filter ?? {}),
        where: {
          ...((filter ?? {}).where ?? {}),
        },
      },
    );

    return distinct_value_count;
  }

  // Key Count
  @authenticate('GET.entities.signatures.key_count')
  @get('/entities/{id}/signatures/key_count', {
    tags: ['Entity'],
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
    @repository(SignatureRepository)
    signatureRepository: SignatureRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature))
    filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: number}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);

    const key_count = await signatureRepository.key_counts_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });

    return key_count;
  }

  @authenticate('GET.signatures.entities.key_count')
  @get('/signatures/{id}/entities/key_count', {
    tags: ['Signature'],
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
    @repository(EntityRepository)
    entityRepository: EntityRepository,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Entity))
    filter?: Filter<Entity>,
    @param.query.string('filter_str') filter_str = '',
  ): Promise<{[key: string]: number}> {
    if (filter_str !== '' && filter == null) filter = JSON.parse(filter_str);
    const key_count = await entityRepository.key_counts_through(id, {
      ...(filter ?? {}),
      where: {
        ...((filter ?? {}).where ?? {}),
      },
    });

    return key_count;
  }
}
