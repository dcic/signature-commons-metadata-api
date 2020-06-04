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
    @service('BackgroundProcessService') private bg: BackgroundProcessService,
    @inject.context() private ctx: RequestContext,
  ) {}

  @authenticate('OPTIMIZE')
  @get('/refresh', {
    operationId: 'optimize.refresh',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Refresh materialized views',
      },
    },
  })
  async refresh(@param.query.string('view') view?: string): Promise<void> {
    if (
      this.bg.status !== undefined &&
      this.bg.status.indexOf('ERROR:') !== 0
    ) {
      throw new HttpErrors.Conflict(
        `Optimization already running: ${this.bg.status}`,
      );
    } else {
      this.bg.status = 'Starting...';
      this.bg.spawn(async () => {
        this.bg.status = 'refresh_materialized_views';
        await this.dataSource.refresh_materialized_views(view);
        this.bg.status = undefined;
      });
    }
  }

  @authenticate('OPTIMIZE')
  @get('/index', {
    operationId: 'optimize.index',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Ensure index is present on field `table_name.deep.field`',
      },
    },
  })
  async index(@param.query.string('field') field: string): Promise<void> {
    if (
      this.bg.status !== undefined &&
      this.bg.status.indexOf('ERROR:') !== 0
    ) {
      throw new HttpErrors.Conflict(
        `Optimization already running: ${this.bg.status}`,
      );
    } else {
      this.bg.status = 'Starting...';
      this.bg.spawn(async () => {
        this.bg.status = 'get repo';
        const field_split = field.split('.');
        const table = field_split[0];
        const repo = await this.ctx.get<IGenericRepository<IGenericEntity>>(
          `repositories.${table}`,
        );
        this.bg.status = 'ensureIndex';
        await repo.ensureIndex(field_split.slice(1).join('.'));
        this.bg.status = undefined;
      });
    }
  }

  @authenticate('OPTIMIZE.status')
  @get('/status', {
    operationId: 'Optimization.status',
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
    if (this.bg.status === undefined) {
      return 'Ready';
    } else {
      return this.bg.status;
    }
  }
}

export {OptimizationController};
