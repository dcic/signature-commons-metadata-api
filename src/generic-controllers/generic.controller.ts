import { validate } from '@dcic/signature-commons-schema';
import { authenticate, AuthenticationBindings, UserProfile } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { Constructor } from '@loopback/core';
import { Count, CountSchema, DataObject, DefaultCrudRepository, Entity, Filter, repository, Where } from '@loopback/repository';
import { api, del, get, getFilterSchemaFor, getWhereSchemaFor, HttpErrors, param, patch, post, requestBody, Response, RestBindings } from '@loopback/rest';
import * as uuidv4 from 'uuid/v4';
import { applyFieldsFilter } from '../util/applyFieldsFilter';
import debug from '../util/debug';
import { flatten_keys } from '../util/flatten-keys';
import { keyCounts, valueCounts } from '../util/key-counts';
import { sortedDict } from '../util/sorted-dict';
import { sum } from '../util/sum';

export class IGenericEntity extends Entity {
  $validator?: string
  id: string
  meta: object
}

export class IGenericRepository<T extends IGenericEntity> extends DefaultCrudRepository<T, string> {
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
  dbck(filter: Filter<GenericEntity>, filter_str?: string, contentRange?: boolean, ): Promise<object>
  find_get(filter?: Filter<GenericEntity>, filter_str?: string, contentRange?: boolean, ): Promise<GenericEntity[]>
  find(props: { filter?: Filter<GenericEntity>, contentRange?: boolean }): Promise<GenericEntity[]>
  updateAll(body: DataObject<GenericEntity>, where?: Where<GenericEntity>, where_str?: string, ): Promise<Count>
  findById(id: string): Promise<GenericEntity>
  updateById(id: string, obj: GenericEntity, ): Promise<void>
  deleteById(id: string): Promise<void>
}

export function GenericControllerFactory<
  GenericEntity extends IGenericEntity,
  GenericRepository extends IGenericRepository<GenericEntity>
>(
  props: {
    GenericRepository: Constructor<GenericRepository>
    GenericEntity: typeof IGenericEntity
    GenericEntitySchema: any,
    modelName: string
    basePath: string
  }
): Constructor<GenericController<GenericEntity, GenericRepository>> {

  const modelSchema = '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json'

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
          content: { 'application/json': { 'x-ts-type': props.GenericEntity } },
        },
      },
    })
    async create(@requestBody() obj: GenericEntity): Promise<GenericEntity> {
      try {
        const entity = await validate<GenericEntity>(
          {
            $validator: modelSchema,
            ...(<any>obj)
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
        throw new HttpErrors.NotAcceptable(e)
      }
    }

    @authenticate('GET.' + props.modelName + '.count')
    @get('/count', {
      tags: [props.modelName],
      operationId: props.modelName + '.count',
      responses: {
        '200': {
          description: props.modelName + ' model count',
          content: { 'application/json': { schema: CountSchema } },
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

      if (depth < 0)
        throw new Error("Depth must be greater than 0")

      const results = await this.genericRepository.find({
        ...filter, fields: undefined
      })

      await this.set_content_range({ filter, results, contentRange })

      return sortedDict(
        keyCounts(
          results.map(
            (obj) => applyFieldsFilter(obj.meta, ((filter || {}).fields || []))
          ),
          depth
        ),
        (a, b) => b - a
      )
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
      },
    })
    async value_count(
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
      @param.query.number('depth') depth: number = 0,
      @param.query.boolean('contentRange') contentRange: boolean = true,
    ): Promise<{ [key: string]: { [value: string]: number } }> {
      if (filter_str !== '' && filter == null)
        filter = JSON.parse(filter_str)

      if (depth < 0)
        throw new Error("Depth must be greater than 0")

      const results = await this.genericRepository.find({
        ...filter, fields: undefined
      })

      await this.set_content_range({ filter, results, contentRange })

      return sortedDict(
        valueCounts(
          results.map(
            (obj) => applyFieldsFilter(obj.meta, ((filter || {}).fields || []))
          ),
          depth
        ),
        (a, b) => sum(Object.values(b)) - sum(Object.values(a))
      )
    }

    @authenticate('GET.' + props.modelName + '.dbck')
    @get('/dbck', {
      tags: [props.modelName],
      operationId: props.modelName + '.dbck',
      responses: {
        '200': {
          description: 'Check model instances',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object'
                },
              },
            },
          },
        }
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

      for await (let obj of results) {
        if (results.length >= limit)
          break
        try {
          obj = await validate<GenericEntity>(
            {
              $validator: modelSchema,
              ...(<any>obj)
            },
            modelSchema
          )
        } catch (e) {
          objs = objs.concat(e)
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
                    { type: 'object', description: 'Error object' }
                  ]
                },
              },
            },
          },
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

          results.push(resolved_obj)
        } catch (err) {
          results.push({ 'error': JSON.stringify(err) })
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
      @requestBody() { filter, contentRange }: {
        filter?: Filter<GenericEntity>,
        contentRange?: boolean
      }
    ): Promise<GenericEntity[]> {
      if (filter === undefined)
        filter = {}

      const results = await this.genericRepository.find({
        ...filter, fields: undefined
      })

      await this.set_content_range({ filter, results, contentRange })

      return results.map(
        (obj) => applyFieldsFilter(
          {
            $validator: modelSchema,
            ...(<any>obj),
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
      },
    })
    async updateAll(
      @requestBody() body: DataObject<GenericEntity>,
      @param.query.object('where', getWhereSchemaFor(props.GenericEntity)) where?: Where<GenericEntity>,
      @param.query.string('where_str') where_str: string = '',
    ): Promise<Count> {
      if (where_str !== '' && where === undefined)
        where = JSON.parse(where_str)

      const objs: GenericEntity[] = await this.genericRepository.find({ where })
      let results: Array<object> = []

      for await (let obj of objs) {
        try {
          obj = await validate<GenericEntity>(
            <GenericEntity>{
              $validator: modelSchema,
              ...<object>obj,
              ...<object>body,
            },
            modelSchema
          )
        } catch (e) {
          results = results.concat(e)
        }
      }

      if (results.length > 0) {
        debug(JSON.stringify(results))
        throw new HttpErrors.NotAcceptable(JSON.stringify(results))
      }

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
      },
    })
    async updateById(
      @param.path.string('id') id: string,
      @requestBody() obj: GenericEntity,
    ): Promise<void> {
      try {
        return await this.genericRepository.updateById(id,
          await validate<GenericEntity>(
            {
              $validator: modelSchema,
              ...(<any>obj)
            },
            modelSchema
          )
        )
      } catch (e) {
        debug(JSON.stringify(e))
        throw new HttpErrors.NotAcceptable(e)
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
      },
    })
    async deleteById(@param.path.string('id') id: string): Promise<void> {
      await this.genericRepository.deleteById(id);
    }
  }

  return Controller
}
