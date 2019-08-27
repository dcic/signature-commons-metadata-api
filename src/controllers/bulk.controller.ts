import { authenticate, AuthenticationBindings } from "@loopback/authentication";
import { inject } from "@loopback/core";
import { api, post, requestBody, RequestContext } from "@loopback/rest";
import { Entity, Library, Resource, Schema, Signature } from "../generic-controllers";
import { UserProfile } from "../models";

const controllers = {
  'Entity': Entity,
  'Signature': Signature,
  'Library': Library,
  'Schema': Schema,
  'Resource': Resource,
}

@api({
  basePath: process.env.PREFIX,
  paths: {}
})
class BulkController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
    @inject.context() private ctx: RequestContext,
  ) { }

  @authenticate('BULK')
  @post('/bulk', {
    operationId: 'bulk',
    responses: {
      '200': {
        description: 'Execute multiple operations at once and get all the results',
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
                      description: 'A message representing the error that occured',
                    },
                  },
                },
              ],
            },
          },
        }
      },
    }
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
                  description: 'The full operationId as described in the swagger (i.e. `Signature.find`)',
                },
                parameters: {
                  type: 'object',
                  description: 'The parameters of the operation (as defined by the Swagger doc)',
                },
                requestBody: {
                  type: 'object',
                  description: 'The request body for the operation (as defined by the Swagger doc)',
                },
              }
            },
          }
        }
      }
    }) ops: {
      operationId: string,
      parameters: { [key: string]: any },
      requestBody: any,
    }[],
  ) {
    const results = []
    for (const op of ops) {
      try {
        const [controller, operationId] = op.operationId.split(/\./g)
        const controllerCls = controllers[controller as keyof (typeof controllers)]
        if (controllerCls === undefined) {
          throw new Error(`Controller '${controller}' is not valid`)
        }
        const Controller = await this.ctx.get<any>(`controllers.${controller}`)
        if (operationId === 'create') {
          results.push(await Controller.create(op.requestBody))
        } else if (operationId === 'count') {
          results.push(await Controller.count(op.parameters.where))
        } else if (operationId === 'key_count') {
          results.push(await Controller.key_count(op.parameters.filter, '', op.parameters.depth, op.parameters.contentRange))
        } else if (operationId === 'value_count') {
          results.push(await Controller.value_count(op.parameters.filter, '', op.parameters.depth, op.parameters.contentRange))
        } else if (operationId === 'distinct_value_count') {
          results.push(await Controller.distinct_value_count(op.parameters.filter, '', op.parameters.depth, op.parameters.contentRange))
        } else if (operationId === 'dbck') {
          results.push(await Controller.dbck(op.parameters.filter))
        } else if (operationId === 'find_or_create') {
          results.push(await Controller.find_or_create(op.requestBody))
        } else if (operationId === 'find') {
          results.push(await Controller.find(op.parameters))
        } else if (operationId === 'updateAll') {
          results.push(await Controller.updateAll(op.requestBody, op.parameters.where))
        } else if (operationId === 'findById') {
          results.push(await Controller.findById(op.parameters.id))
        } else if (operationId === 'updateById') {
          results.push(await Controller.updateById(op.parameters.id, op.requestBody))
        } else if (operationId === 'deleteById') {
          results.push(await Controller.deleteById(op.parameters.id))
        } else {
          throw new Error(`'${controller}.${operationId}' not recognized`)
        }
      } catch (e) {
        results.push({'error': e+''})
      }
    }
    return results
  }
}

export { BulkController };
