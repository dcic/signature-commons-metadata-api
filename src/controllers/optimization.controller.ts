import { api, post, param, RestBindings, RequestContext, get, Response } from "@loopback/rest";
import { authenticate, AuthenticationBindings } from "@loopback/authentication";
import { inject } from "@loopback/core";
import { UserProfile } from "../models";
import { TypeORMDataSource } from "../datasources";
import { TypeORMRepository } from "../repositories";
import { IGenericRepository, IGenericEntity } from "../generic-controllers/generic.controller";

@api({
  basePath: `${process.env.PREFIX}/optimize`,
  paths: {}
})
class OptimizationController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
    @inject('datasources.typeorm') private dataSource: TypeORMDataSource,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject.context() private ctx: RequestContext,
  ) { }

  @authenticate('OPTIMIZE')
  @get('/refresh', {
    operationId: 'optimize.refresh',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Refresh materialized views',
      }
    }
  })
  async refresh(
    @param.query.string('view') view?: string
  ): Promise<void> {
    await this.dataSource.refresh_materialized_views(view)
  }

  @authenticate('OPTIMIZE')
  @get('/index', {
    operationId: 'optimize.index',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Ensure index is present on field `table_name.deep.field`',
      }
    }
  })
  async index(
    @param.query.string('field') field: string
  ): Promise<void> {
    const field_split = field.split('.')
    const table = field_split[0]
    const repo = await this.ctx.get<IGenericRepository<IGenericEntity>>(`repositories.${table}`)
    await repo.ensureIndex(field_split.slice(1).join('.'))
  }
}

export { OptimizationController }