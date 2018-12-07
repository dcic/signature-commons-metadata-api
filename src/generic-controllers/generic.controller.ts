import { validate } from '@dcic/signature-commons-schema';
import { authenticate, AuthenticationBindings, UserProfile } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { Constructor } from '@loopback/core';
import { Count, CountSchema, DataObject, DefaultCrudRepository, Entity, Filter, repository, Where } from '@loopback/repository';
import { api, del, get, getFilterSchemaFor, getWhereSchemaFor, HttpErrors, param, patch, post, requestBody } from '@loopback/rest';
import debug from '../util/debug';
import { keyCounts, valueCounts } from '../util/key-counts';
import { sortedDict } from '../util/sorted-dict';
import { sum } from '../util/sum';
import { applyFieldsFilter } from '../util/applyFieldsFilter';

export class IGenericEntity extends Entity {
  $validator?: string
  id: string
  meta: object
}

export class IGenericRepository<T extends IGenericEntity> extends DefaultCrudRepository<T, string> {
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
  ): Constructor<any> {

  const modelSchema = '/@dcic/signature-commons-schema/core/' + props.modelName.toLowerCase() + '.json'

  @api({
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
    ) { }

    @authenticate('POST.' + props.modelName + '.create')
    @post(props.basePath + '', {
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
    @get(props.basePath + '/count', {
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
    @get(props.basePath + '/key_count', {
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
    ): Promise<{ [key: string]: number }> {
      if (filter_str !== '' && filter === {})
        filter = JSON.parse(filter_str)

      if (depth < 0)
        throw new Error("Depth must be greater than 0")

      return sortedDict(
        keyCounts(
          (await this.genericRepository.find({
            ...filter, fields: undefined
          })).map(
            (obj) => applyFieldsFilter(obj.meta, ((filter || {}).fields || []))
          ),
          depth
        ),
        (a, b) => b - a
      )
    }

    @authenticate('GET.' + props.modelName + '.value_count')
    @get(props.basePath + '/value_count', {
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
    ): Promise<{ [key: string]: { [value: string]: number } }> {
      if (filter_str !== '' && filter === {})
        filter = JSON.parse(filter_str)

      if (depth < 0)
        throw new Error("Depth must be greater than 0")

      return sortedDict(
        valueCounts(
          (await this.genericRepository.find({
            ...filter, fields: undefined
          })).map(
            (obj) => applyFieldsFilter(obj.meta, ((filter || {}).fields || []))
          ),
          depth
        ),
        (a, b) => sum(Object.values(b)) - sum(Object.values(a))
      )
    }

    @authenticate('GET.' + props.modelName + '.dbck')
    @get(props.basePath + '/dbck', {
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
    ): Promise<object> {
      if (filter_str !== '' && filter === {})
        filter = JSON.parse(filter_str)

      // Take limit out of query, we'll use it to count results
      const limit = filter.limit || 1
      delete filter.limit

      const objs = await this.genericRepository.find(filter);
      let results: Array<object> = []

      for await (let obj of objs) {
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
          results = results.concat(e)
        }
      }

      return results
    }

    @authenticate('GET.' + props.modelName + '.find')
    @get(props.basePath + '', {
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
    ): Promise<GenericEntity[]> {
      return await this.find(filter, filter_str)
    }

    @authenticate('GET.' + props.modelName + '.find')
    @post(props.basePath + '/find', {
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
      @param.query.object('filter', getFilterSchemaFor(props.GenericEntity)) filter?: Filter<GenericEntity>,
      @param.query.string('filter_str') filter_str: string = '',
    ): Promise<GenericEntity[]> {
      if (filter_str !== '' && filter === {})
        filter = JSON.parse(filter_str)

      return (
        await this.genericRepository.find({
          ...filter, fields: undefined
        })
      ).map(
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
    @patch(props.basePath + '', {
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
    @get(props.basePath + '/{id}', {
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
    @patch(props.basePath + '/{id}', {
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
    @del(props.basePath + '/{id}', {
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
