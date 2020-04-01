import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  api,
  post,
  requestBody,
  RequestContext,
  RestBindings,
  Response,
  HttpErrors,
} from '@loopback/rest';
import {
  Entity,
  Library,
  Resource,
  Schema,
  Signature,
} from '../generic-controllers';
import {UserProfile} from '../models';

const controllers = {
  Entity: Entity,
  Signature: Signature,
  Library: Library,
  Schema: Schema,
  Resource: Resource,
};

@api({
  basePath: process.env.PREFIX,
  paths: {},
})
class BulkController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, { optional: true }) private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, { optional: true }) private response: Response,
    @inject.context() private ctx: RequestContext,
  ) {}

  @authenticate('BULK')
  @post('/bulk', {
    operationId: 'bulk',
    responses: {
      '200': {
        description:
          'Execute multiple operations at once and get all the results',
        content: {
          'application/json': {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'object',
                  description: 'The response for the given operation',
                },
                {
                  type: 'object',
                  description: 'An error response for the operation',
                  properties: {
                    error: {
                      type: 'string',
                      description:
                        'A message representing the error that occured',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  })
  async bulk(
    @requestBody({
      description: 'Updated object to replace the object with',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                operationId: {
                  type: 'string',
                  description:
                    'The full operationId as described in the swagger (i.e. `Signature.find`)',
                },
                parameters: {
                  type: 'object',
                  description:
                    'The parameters of the operation (as defined by the Swagger doc)',
                },
                requestBody: {
                  description:
                    'The request body for the operation (as defined by the Swagger doc)',
                  oneOf: [
                    {
                      type: 'object',
                    },
                    {
                      type: 'array',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    })
    ops: {
      operationId: string;
      parameters: {[key: string]: any};
      requestBody: any;
    }[],
  ) {
    const results = [];
    for (const op of ops) {
      try {
        const [controller, operationId] = op.operationId.split(/\./g);
        const controllerCls =
          controllers[controller as keyof typeof controllers];
        if (controllerCls === undefined) {
          throw new HttpErrors.UnprocessableEntity(
            `Controller '${controller}' is not valid`,
          );
        }
        const Controller = await this.ctx.get<any>(`controllers.${controller}`);
        if (operationId === 'create') {
          const response = await Controller.create(op.requestBody);
          results.push({response});
        } else if (operationId === 'count') {
          const response = await Controller.count(op.parameters.where);
          results.push({response});
        } else if (operationId === 'key_count') {
          const response = await Controller.key_count(
            op.parameters.filter,
            '',
            op.parameters.depth,
            op.parameters.contentRange,
          );
          if (op.parameters.contentRange === true) {
            results.push({
              response,
              contentRange: this.response.getHeader('Content-Range'),
            });
          } else {
            results.push({response});
          }
        } else if (operationId === 'value_count') {
          const response = await Controller.value_count(
            op.parameters.filter,
            '',
            op.parameters.depth,
            op.parameters.contentRange,
          );
          if (op.parameters.contentRange === true) {
            results.push({
              response,
              contentRange: this.response.getHeader('Content-Range'),
            });
          } else {
            results.push({response});
          }
        } else if (operationId === 'distinct_value_count') {
          const response = await Controller.distinct_value_count(
            op.parameters.filter,
            '',
            op.parameters.depth,
            op.parameters.contentRange,
          );
          if (op.parameters.contentRange === true) {
            results.push({
              response,
              contentRange: this.response.getHeader('Content-Range'),
            });
          } else {
            results.push({response});
          }
        } else if (operationId === 'dbck') {
          const response = await Controller.dbck(op.parameters.filter);
          if (op.parameters.contentRange === true) {
            results.push({
              response,
              contentRange: this.response.getHeader('Content-Range'),
            });
          } else {
            results.push({response});
          }
        } else if (operationId === 'find_or_create') {
          const response = await Controller.find_or_create(op.requestBody);
          results.push({response});
        } else if (operationId === 'find') {
          const response = await Controller.find(op.parameters);
          if (op.parameters.contentRange === true) {
            results.push({
              response,
              contentRange: this.response.getHeader('Content-Range'),
            });
          } else {
            results.push({response});
          }
        } else if (operationId === 'updateAll') {
          const response = await Controller.updateAll(
            op.requestBody,
            op.parameters.where,
          );
          results.push({response});
        } else if (operationId === 'findById') {
          const response = await Controller.findById(op.parameters.id);
          results.push({response});
        } else if (operationId === 'updateById') {
          const response = await Controller.updateById(
            op.parameters.id,
            op.requestBody,
          );
          results.push({response});
        } else if (operationId === 'deleteById') {
          const response = await Controller.deleteById(op.parameters.id);
          results.push({response});
        } else {
          throw new HttpErrors.UnprocessableEntity(
            `'${controller}.${operationId}' not recognized`,
          );
        }
      } catch (e) {
        results.push({error: e + ''});
      }
    }
    return results;
  }
}

export {BulkController};
