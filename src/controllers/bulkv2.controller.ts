import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  api,
  post,
  requestBody,
  RequestContext,
  RestBindings,
  Response,
} from '@loopback/rest';
import {BulkController} from './bulk.controller'
import {UserProfile} from '../models';
import jq from 'node-jq';
import {resolve} from '../util/resolvable'

async function resolve_jq(expr: string, cb: any, ctx: any, cache: any) {
  const m: any = /^(?<start>(\.[a-z_A-Z]+)+)(?<end>.+)/.exec(expr)
  if (m === null) {
    throw new Error('Could not parse expr')
  }
  const { start, end } = m.groups
  const resolved_start = await (start.split('.').filter(
    (s: string) => s != '').reduce(
      async (agg: Promise<any>, field: string) =>
        await resolve((await agg)[field], cb, ctx, cache),
      Promise.resolve(ctx)
    )
  )
  return await jq.run(
    end.startsWith('.') ? end : `.${end}`,
    resolved_start,
    { input: 'json', output: 'json' } as any
  )
}

@api({
  basePath: process.env.PREFIX,
  paths: {},
})
class BulkV2Controller {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, {optional: true})
    private response: Response,
    @inject.context() private ctx: RequestContext,
    @inject('controllers.BulkController') private bulkController: BulkController,
  ) {}


  async _resolve_callback(val: any, cb: any, ctx: any, cache?: any): Promise<any> {
    let result: any
    if (typeof val === 'string') {
      result = await resolve_jq(await resolve(val, cb, ctx, cache), cb, ctx, cache)
    } else if (typeof val === 'object') {
      let { operationId, parameters, requestBody } = val['$resolve']
      result = await this.bulkController.bulk({
        operationId: await resolve(operationId, cb, ctx, cache),
        parameters: await resolve(parameters, cb, ctx, cache),
        requestBody: await resolve(requestBody, cb, ctx, cache),
      } as any)
    }
    return result
  }

  @authenticate('BULK')
  @post('/bulk/v2', {
    operationId: 'bulk',
    responses: {
      '200': {
        description:
          'Execute multiple operations at once and get all the results',
        content: {
          'application/json': {
            type: 'object'
          }
        }
      }
    }
  })
  async bulkv2(
    @requestBody({
      description: 'Updated object to replace the object with',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
          }
        }
      }
    })
    req: any
  ) {
    const result = await resolve(req, this._resolve_callback, req)
    return result
  }
}

export {BulkV2Controller};
