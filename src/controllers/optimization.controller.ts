import {
  api,
  param,
  RestBindings,
  RequestContext,
  get,
  Response,
} from '@loopback/rest';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {UserProfile} from '../models';
import {TypeORMDataSource} from '../datasources';
import {
  IGenericRepository,
  IGenericEntity,
} from '../generic-controllers/generic.controller';
import {BackgroundProcessService} from '../services';

@api({
  basePath: `${process.env.PREFIX}/optimize`,
  paths: {},
})
class OptimizationController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, {optional: true})
    private response: Response,
    @inject('datasources.typeorm') private dataSource: TypeORMDataSource,
    @service(BackgroundProcessService) private bg: BackgroundProcessService,
    @inject.context() private ctx: RequestContext,
  ) {}

  @authenticate('OPTIMIZE')
  @get('/refresh', {
    operationId: 'Optimize.refresh',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Refresh materialized views',
      },
    },
  })
  async refresh(@param.query.string('view') view?: string): Promise<void> {
    await this.bg.spawn(async () => {
      await this.bg.setStatus('refresh_materialized_views');
      await this.dataSource.refresh_materialized_views(view);
    });
  }

  @authenticate('OPTIMIZE')
  @get('/index', {
    operationId: 'Optimize.index',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Ensure index is present on field `table_name.deep.field`',
      },
    },
  })
  async index(@param.query.string('field') field: string): Promise<void> {
    await this.bg.spawn(async () => {
      await this.bg.setStatus('get repo');
      const field_split = field.split('.');
      const table = field_split[0];
      const repo = await this.ctx.get<IGenericRepository<IGenericEntity>>(
        `repositories.${table}`,
      );
      await this.bg.setStatus('ensureIndex');
      await repo.ensureIndex(field_split.slice(1).join('.'));
    });
  }

  @authenticate('OPTIMIZE.status')
  @get('/status', {
    operationId: 'Optimize.status',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'The status of the last optimization request',
        content: {
          'application/json': {
            schema: {
              description:
                'A human readable description of the status. "Ready" will be used when it is done.',
              type: 'string',
            },
          },
        },
      },
    },
  })
  async status(): Promise<string> {
    return this.bg.getStatus();
  }
}

export {OptimizationController};
