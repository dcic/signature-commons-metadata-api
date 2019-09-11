import { validate } from '@dcic/signature-commons-schema';
import { authenticate, AuthenticationBindings, UserProfile } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { Constructor } from '@loopback/core';
import { Count, CountSchema, DataObject, EntityCrudRepository, Entity, Filter, repository, Where } from '@loopback/repository';
import { api, del, get, getFilterSchemaFor, getWhereSchemaFor, HttpErrors, param, patch, post, requestBody, Response, RestBindings } from '@loopback/rest';
import * as uuidv4 from 'uuid/v4';
import debug from '../util/debug';
import serializeError from 'serialize-error'
import { flatten_keys } from '../util/flatten-keys'
import { TypeORMDataSource } from '../datasources';
import { applyFieldsFilter } from '../util/applyFieldsFilter';

export class IGenericEntity extends Entity {
  $validator?: string
  id: string
  meta: object
}

export interface IGenericRepository<T extends IGenericEntity> extends EntityCrudRepository<T, string> {
  dataSource: TypeORMDataSource
  key_counts(filter?: Filter<T>): Promise<{ [key: string]: number }>
  value_counts(filter?: Filter<T>): Promise<{ [key: string]: { [key: string]: number } }>
  distinct_value_counts(filter?: Filter<T>): Promise<{ [key: string]: number }>
}

export interface GenericController<
  GenericEntity extends IGenericEntity,
  GenericRepository extends IGenericRepository<GenericEntity>
  > {
  genericRepository: IGenericRepository<GenericEntity>

  set_content_range(props: { filter?: Filter<GenericEntity>, contentRange?: boolean, results: GenericEntity[] }): Promise<void>
  create(obj: GenericEntity): Promise<GenericEntity>
  count(where?: Where<GenericEntity>, where_str?: string): Promise<Count>
  key_count(filter?: Filter<GenericEntity>, filter_str?: string, depth?: number, contentRange?: boolean): Promise<{ [key: string]: number }>
  value_count(filter?: Filter<GenericEntity>, filter_str?: string, depth?: number, contentRange?: boolean, ): Promise<{ [key: string]: { [value: string]: number } }>
  distinct_value_count(filter?: Filter<GenericEntity>, filter_str?: string, depth?: number, contentRange?: boolean): Promise<{ [key: string]: number }>
  dbck(filter: Filter<GenericEntity>, filter_str?: string, contentRange?: boolean, ): Promise<object>
  find_get(filter?: Filter<GenericEntity>, filter_str?: string, contentRange?: boolean, ): Promise<GenericEntity[]>
  find(props: { filter?: Filter<GenericEntity>, contentRange?: boolean }): Promise<GenericEntity[]>
  updateAll(body: DataObject<GenericEntity>, where?: Where<GenericEntity>, where_str?: string, ): Promise<Count>
  findById(id: string): Promise<GenericEntity>
  updateById(id: string, obj: GenericEntity, ): Promise<void>
  deleteById(id: string): Promise<void>
}

function prune(obj: { [key: string]: any | undefined }): { [key: string]: any } {
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key]
    }
  }
  return obj
}

export function GenericControllerFactory<
  GenericEntity extends IGenericEntity,
  GenericRepository extends IGenericRepository<GenericEntity>
>(
  props: {
    GenericRepository: Constructor<GenericRepository>
    GenericEntity: typeof IGenericEntity
    GenericEntitySchema: any
    modelName: string
    basePath: string
  }
): Constructor<GenericController<GenericEntity, GenericRepository>> {

  const modelSchema = '/dcic/signature-commons-schema/v5/core/' + props.modelName.toLowerCase() + '.json'

  @api({
    basePath: props.basePath,
    paths: {},
    components: {
      schemas: {
        [props.modelName]: props.GenericEntitySchema,
      },
    },
  })
  class Controller {
    constructor(
      @repository(props.GenericRepository) public genericRepository: IGenericRepository<GenericEntity>,
      @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
      @inject(RestBindings.Http.RESPONSE) private response: Response,
    ) { }

    async set_content_range({ filter, results, contentRange }: { filter?: Filter<GenericEntity>, contentRange?: boolean, results: GenericEntity[] }) {
      if (contentRange !== false) {
        if (filter === undefined) filter = {}
        let count: number
        if (filter.limit === undefined)
          count = results.length + (filter.skip || filter.offset || 0)
        else
          count = (await this.genericRepository.count(filter.where)).count

        const start: number = filter.skip || filter.offset || 0
        const end = Math.min(
          start + (filter.limit || Infinity),
          count,
        )

        this.response.setHeader(
          'Access-Control-Expose-Headers',
          [
            ...this.response.getHeaderNames(),
            'Content-Range',
          ].join(',')
        );
        this.response.setHeader('Content-Range', `${start}-${end}/${count}`);
      }
    }

    @authenticate('POST.' + props.modelName + '.create')
    @post('', {
      tags: [props.modelName],
      operationId: props.modelName + '.create',
      responses: {
        '200': {
          description: props.modelName + ' model instance',
          content: {
            'application/json': {
              schema: {
                'x-ts-type': props.GenericEntity
              }
            }
          },
        },
        '401': {
          description: 'Access denied'
        },
        '422': {
          description: 'validation of model instance failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'ajv validation error'
              }
            }
          },
        }
      },
    })
    async create(@requestBody({
      description: 'Full object to be created',
      required: true,
      content: {
        'application/json': {
          schema: {
            'x-ts-type': props.GenericEntity
          }
        }
      }
    }) obj: GenericEntity): Promise<GenericEntity> {
      try {
        debug('create', obj)
        const entity = await validate<GenericEntity>(
          {
            $validator: modelSchema,
            ...(<any>prune(obj))
          },
          modelSchema
        )
        delete entity.$validator

        return {
          $validator: modelSchema,
          ...(<any>await this.genericRepository.create(entity))
        }
      } catch (e) {
        debug(e)
        throw new HttpErrors.NotAcceptable(serializeError(e))
      }
    }

    @authenticate('GET.' + props.modelName + '.count')
    @get('/count', {
      tags: [props.modelName],
      operationId: props.modelName + '.count',
      responses: {
        '200': {
          description: props.modelName + ' model count',
          content: {
            'application/json': {
              schema: CountSchema
            }
          },
        },
      },
    })
    async count(
      @param.query.object('where', getWhereSchemaFor(props.GenericEntity)) where?: Where<GenericEntity>,
      @param.query.string('where_str') where_str: string = '',
    ): Promise<Count> {
      if (where_str !== '' && where === {})
        where = JSON.parse(where_str)

      return await this.genericRepository.count(where);
    }

    @authenticate('GET.' + props.modelName + '.key_count')
    @get('/key_count', {
      tags: [props.modelName],
      operationId: props.modelName + '.key_count',
      responses: {
        '200': {
          description: props.modelName + ' model key_count (number of unique keys which appear in the query results)',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'The key in the database paired with the number of those keys'
                }
              }
            }
          },
        },
        '401': {
          description: 'Access denied'
        },
      },
    })
    async key_count(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.number('depth') depth: number = 0,
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<{ [key: string]: number }> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)
      if (filter === undefined)
        filter = {}

      if (!filter.where) {
        return this.genericRepository.dataSource.key_counts(props.GenericEntity, filter)
      } else {
        return await this.genericRepository.key_counts(filter)
      }
    }

    @authenticate('GET.' + props.modelName + '.value_count')
    @get('/value_count', {
      tags: [props.modelName],
      operationId: props.modelName + '.value_count',
      responses: {
        '200': {
          description: props.modelName + ' model value_count (number of unique keys and values which appear in the query results)',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'The key-values in the database paired with the number of those key-values'
                }
              }
            }
          },
        },
        '401': {
          description: 'Access denied'
        },
      },
    })
    async value_count(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.number('depth') depth: number = 0,
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<{ [key: string]: { [key: string]: number } }> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)

      if (filter === undefined)
        filter = {}

      if (!filter.where) {
        return this.genericRepository.dataSource.value_counts(props.GenericEntity, filter)
      } else {
        return await this.genericRepository.value_counts(filter)
      }
    }

    @authenticate('GET.' + props.modelName + '.distinct_value_count')
    @get('/distinct_value_count', {
      tags: [props.modelName],
      operationId: props.modelName + '.distinct_value_count',
      responses: {
        '200': {
          description: props.modelName + ' model distinct_value_count (number of unique values which appear in the query results)',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'The key in the database paired with the number of disticting values for those keys'
                }
              }
            }
          },
        },
        '401': {
          description: 'Access denied'
        },
      },
    })
    async distinct_value_count(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.number('depth') depth: number = 0,
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<{ [key: string]: number }> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)

      if (filter === undefined)
        filter = {}

      if (!filter.where) {
        return this.genericRepository.dataSource.distinct_value_counts(props.GenericEntity, filter)
      } else {
        return await this.genericRepository.distinct_value_counts(filter)
      }
    }

    @authenticate('GET.' + props.modelName + '.dbck')
    @get('/dbck', {
      tags: [props.modelName],
      operationId: props.modelName + '.dbck',
      responses: {
        '200': {
          description: 'Check model instances and report errors',
          content: {
            'application/json': {
              schema: {
                description: 'ajv errors experienced while validating database entries',
                type: 'array',
                items: {
                  type: 'object'
                },
              },
            },
          },
        },
        '401': {
          description: 'Access denied'
        },
      }
    })
    async dbck(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter: Filter<GenericEntity> = {},
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<object> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)

      // Take limit out of query, we'll use it to count results
      const limit = filter.limit || 1

      const results = await this.genericRepository.find({
        ...filter, limit: undefined
      })

      await this.set_content_range({ filter, results, contentRange })

      let objs: Array<object> = []
      let n = 0

      for (let obj of results) {
        if (n >= limit)
          break
        try {
          obj = await validate<GenericEntity>(
            {
              $validator: modelSchema,
              ...(<any>prune(obj))
            },
            modelSchema
          )
        } catch (e) {
          objs = objs.concat(serializeError(e))
          n += 1;
        }
      }

      return objs
    }

    @authenticate('POST.' + props.modelName + '.find_or_create')
    @post('/find_or_create', {
      tags: [props.modelName],
      operationId: props.modelName + '.find_or_create',
      responses: {
        '200': {
          description: 'Array of ' + props.modelName + 'model instances',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  oneOf: [
                    { 'x-ts-type': props.GenericEntity },
                    {
                      type: 'object',
                      description: 'Error object'
                    }
                  ]
                },
              },
            },
          },
        },
        '401': {
          description: 'Access denied'
        },
      }
    })
    async find_or_create(
      @requestBody({
        description: 'Array of partial objects to be found or created',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
              }
            }
          }
        }
      }) body: DataObject<GenericEntity>[],
    ): Promise<object[]> {
      // TODO: fuzzy matching
      // TODO: fuzzy merging (incorporate new incoming information)

      const results: object[] = []

      for (const obj of body) {
        try {
          let resolved_obj: GenericEntity | undefined = undefined

          const possibilities = obj.id !== undefined ? (
            await this.find({
              filter: {
                where: {
                  id: obj.id
                }
              } as any
            })
          ) : (
              await this.find({
                filter: {
                  where: flatten_keys(obj)
                }
              })
            )

          if (possibilities.length > 1)
            throw new Error(`Could not resolve single ${props.modelName} instance`)
          else if (possibilities.length > 0)
            resolved_obj = possibilities[0]

          if (resolved_obj === undefined) {
            if (obj.id === undefined)
              (obj as any).id = uuidv4()

            resolved_obj = await this.create(obj as GenericEntity)
          }

          results.push(prune(resolved_obj))
        } catch (err) {
          debug(err)
          results.push(serializeError(err))
        }
      }
      return results
    }

    @authenticate('GET.' + props.modelName + '.find')
    @get('', {
      tags: [props.modelName],
      operationId: props.modelName + '.find_get',
      responses: {
        '200': {
          description: 'Array of ' + props.modelName + ' model instances',
          content: {
            'application/json': {
              schema: { type: 'array', items: { 'x-ts-type': props.GenericEntity } },
            },
          },
        },
      },
    })
    async find_get(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<GenericEntity[]> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)

      return await this.find({ filter, contentRange })
    }

    @authenticate('GET.' + props.modelName + '.find')
    @post('/find', {
      tags: [props.modelName],
      operationId: props.modelName + '.find',
      responses: {
        '200': {
          description: 'Array of ' + props.modelName + ' model instances',
          content: {
            'application/json': {
              schema: { type: 'array', items: { 'x-ts-type': props.GenericEntity } },
            },
          },
        },
      },
    })
    async find(
      @requestBody({
        description: 'JSON of the find GET parameters',
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                filter: {
                  type: 'object',
                  description: 'filter rules for entity',
                },
                contentRange: {
                  type: 'boolean',
                  description: 'whether or not to compute the contentRange header'
                }
              }
            }
          }
        }
      }) { filter, contentRange }: {
        filter?: Filter<GenericEntity>,
        contentRange?: boolean
      }
    ): Promise<GenericEntity[]> {
      if (filter === undefined)
        filter = {}

      const results = await this.genericRepository.find({
        ...filter
      })

      await this.set_content_range({ filter, results, contentRange })
      return results.map(
        (obj) => applyFieldsFilter(
          {
            $validator: modelSchema,
            ...(<any>prune(obj)),
          },
          ((filter || {}).fields || [])
        )
      );
    }

    @authenticate('PATCH.' + props.modelName + '.updateAll')
    @patch('', {
      tags: [props.modelName],
      operationId: props.modelName + '.updateAll',
      responses: {
        '200': {
          description: props.modelName + ' PATCH success count',
          content: { 'application/json': { schema: CountSchema } },
        },
        '401': {
          description: 'Access denied'
        },
        '422': {
          description: 'validation error during update',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Error object'
              }
            }
          }
        }
      },
    })
    async updateAll(
      @requestBody({
        description: 'Object to replace all objects which match the `where` query with',
        required: true,
        content: {
          'application/json': {
            schema: {
              'x-ts-type': props.GenericEntity
            }
          }
        }
      }) body: DataObject<GenericEntity>,
      @param.query.object('where', getWhereSchemaFor(props.GenericEntity)) where?: Where<GenericEntity>,
      @param.query.string('where_str') where_str: string = '',
    ): Promise<Count> {
      if (where_str !== '' && where === undefined)
        where = JSON.parse(where_str)

      const objs: GenericEntity[] = await this.genericRepository.find({ where })
      let results: Array<object> = []

      for (let obj of objs) {
        try {
          obj = await validate<GenericEntity>(
            <GenericEntity>{
              $validator: modelSchema,
              ...<object>prune(obj),
              ...<object>body,
            },
            modelSchema
          )
        } catch (e) {
          debug(e)
          results = results.concat(serializeError(e))
        }
      }

      if (results.length > 0)
        throw new HttpErrors.NotAcceptable(JSON.stringify(results))

      return await this.genericRepository.updateAll(body, where)
    }

    @authenticate('GET.' + props.modelName + '.findById')
    @get('/{id}', {
      tags: [props.modelName],
      operationId: props.modelName + '.findById',
      responses: {
        '200': {
          description: props.modelName + ' model instance',
          content: { 'application/json': { 'x-ts-type': props.GenericEntity } },
        },
      },
    })
    async findById(@param.path.string('id') id: string): Promise<GenericEntity> {
      return {
        $validator: modelSchema,
        ...(<any>await this.genericRepository.findById(id)),
      };
    }

    @authenticate('PATCH.' + props.modelName + '.updateById')
    @patch('/{id}', {
      tags: [props.modelName],
      operationId: props.modelName + '.updateById',
      responses: {
        '204': {
          description: props.modelName + ' PATCH success',
        },
        '401': {
          description: 'Access denied'
        },
        '422': {
          description: 'ajv validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object'
              }
            }
          }
        },
      },
    })
    async updateById(
      @param.path.string('id') id: string,
      @requestBody({
        description: 'Updated object to replace the object with',
        required: true,
        content: {
          'application/json': {
            schema: {
              'x-ts-type': props.GenericEntity
            }
          }
        }
      }) obj: GenericEntity,
    ): Promise<void> {
      try {
        const validated = await validate<GenericEntity>(
          {
            $validator: modelSchema,
            ...(<any>prune(obj))
          },
          modelSchema
        )
        delete validated['$validator']
        await this.genericRepository.updateById(id, validated)
      } catch (e) {
        debug(e)
        throw new HttpErrors.NotAcceptable(serializeError(e))
      }
    }

    @authenticate('DELETE.' + props.modelName + '.deleteById')
    @del('/{id}', {
      tags: [props.modelName],
      operationId: props.modelName + '.deleteById',
      responses: {
        '204': {
          description: props.modelName + ' DELETE success',
        },
        '401': {
          description: 'Access denied'
        },
      },
    })
    async deleteById(@param.path.string('id') id: string): Promise<void> {
      await this.genericRepository.deleteById(id);
    }
  }

  return Controller
}
