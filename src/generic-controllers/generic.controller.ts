import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  Class,
  Repository,
  Model,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  del,
  requestBody,
  api,
} from '@loopback/rest';
import { validate } from 'signature-commons-schema/dist/validate';
import { Constructor } from '@loopback/core';

interface GenericControllerProps<
  GenericModel extends typeof Model,
  GenericRepository extends Class<Repository<Model>>
  > {
  GenericRepository: GenericRepository
  GenericModel: GenericModel
  GenericModelSchema: any,
  modelName: string
  basePath: string
}

export function GenericControllerFactory<
  GenericModel extends typeof Model,
  GenericRepository extends Class<Repository<Model>>
  >(
    props: GenericControllerProps<
      GenericModel,
      GenericRepository
      >
  ): Constructor<any> {
  @api({
    paths: {},
    components: {
      schemas: {
        [props.modelName]: props.GenericModelSchema,
      },
    },
  })
  class Controller {
    constructor(
      @repository(props.GenericRepository)
      public genericRepository: GenericRepository,
    ) { }

    // @post(props.basePath + '', {
    //   operationId: props.modelName + '.create',
    //   responses: {
    //     '200': {
    //       description: props.modelName + ' model instance',
    //       content: {'application/json': {'x-ts-type': props.GenericModel}},
    //     },
    //   },
    // })
    // async create(@requestBody() obj: GenericModel): Promise<GenericModel> {
    //   // TODO: ACL
    //   // TODO: JSON Schema Validation
    //   // return await this.genericRepository.create(obj);
    //   return obj;
    // }

    @get(props.basePath + '/count', {
      operationId: props.modelName + '.count',
      responses: {
        '200': {
          description: props.modelName + ' model count',
          content: { 'application/json': { schema: CountSchema } },
        },
      },
    })
    async count(
      @param.query.object('where', getWhereSchemaFor(props.GenericModel)) where?: Where,
    ): Promise<Count> {
      return await this.genericRepository.count(where);
    }

    @get(props.basePath + '/dbck', {
      operationId: props.modelName + '.dbck',
      responses: {
        '200': {
          description: 'Check model instances',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  'type': 'object',
                  'properties': {
                    obj: {
                      'x-ts-type': props.GenericModel,
                    },
                    errors: {
                      type: 'array',
                      items: {
                        'type': 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        }
      }
    })
    async dbck(
      @param.query.object('filter', getFilterSchemaFor(props.GenericModel)) filter?: Filter,
      @param.query.number('limit') limit?: number,
    ): Promise<Array<object>> {
      const objs = await this.genericRepository.find(filter);
      let results: Array<object> = []

      for await (let obj of objs) {
        if (results.length === limit)
          break
        try {
          obj = await validate({
            $validator: 'https://raw.githubusercontent.com/dcic/signature-commons-schema/next/core/' + props.modelName.toLowerCase() + '.json',
            id: obj.uuid,
            meta: obj.meta,
          })
        } catch (e) {
          results = results.concat(e.errors)
        }
      }

      return results
    }

    @get(props.basePath + '', {
      operationId: props.modelName + '.find',
      responses: {
        '200': {
          description: 'Array of ' + props.modelName + ' model instances',
          content: {
            'application/json': {
              schema: { type: 'array', items: { 'x-ts-type': props.GenericModel } },
            },
          },
        },
      },
    })
    async find(
      // @param.query.object('filter', getFilterSchemaFor(props.GenericModel)) filter?: Filter,
      @param.query.string('filter') filter?: string,
    ): Promise<GenericModel[]> {
      const filterObj = filter !== undefined ? (JSON.parse(filter) as Filter) : undefined

      return await this.genericRepository.find(filterObj);
    }

    // @patch(props.basePath + '', {
    //   operationId: props.modelName + '.updateAll',
    //   responses: {
    //     '200': {
    //       description: props.modelName + ' PATCH success count',
    //       content: {'application/json': {schema: CountSchema}},
    //     },
    //   },
    // })
    // async updateAll(
    //   @requestBody() obj: GenericModel,
    //   @param.query.object('where', getWhereSchemaFor(props.GenericModel)) where?: Where,
    // ): Promise<Count> {
    //   // TODO: ACL
    //   // TODO: JSON Schema Validation
    //   return await this.genericRepository.updateAll(obj, where);
    // }

    @get(props.basePath + '/{id}', {
      operationId: props.modelName + '.findById',
      responses: {
        '200': {
          description: props.modelName + ' model instance',
          content: { 'application/json': { 'x-ts-type': props.GenericModel } },
        },
      },
    })
    async findById(@param.path.number('id') id: number): Promise<GenericModel> {
      return await this.genericRepository.findById(id);
    }

    // @patch(props.basePath + '/{id}', {
    //   operationId: props.modelName + '.updateById',
    //   responses: {
    //     '204': {
    //       description: props.modelName + ' PATCH success',
    //     },
    //   },
    // })
    // async updateById(
    //   @param.path.number('id') id: number,
    //   @requestBody() obj: GenericModel,
    // ): Promise<void> {
    //   // TODO: ACL
    //   // TODO: JSON Schema Validation
    //   await this.genericRepository.updateById(id, obj);
    // }

    // @del(props.basePath + '/{id}', {
    //   operationId: props.modelName + '.deleteById',
    //   responses: {
    //     '204': {
    //       description: props.modelName + ' DELETE success',
    //     },
    //   },
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //   // TODO: ACL
    //   await this.genericRepository.deleteById(id);
    // }
  }

  return Controller
}
