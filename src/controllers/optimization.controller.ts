import {
  api,
  param,
  RestBindings,
  RequestContext,
  get,
  Response,
  HttpErrors,
} from '@loopback/rest';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {UserProfile} from '../models';
import {TypeORMDataSource} from '../datasources';
import {
  IGenericRepository,
  IGenericEntity,
} from '../generic-controllers/generic.controller';

@api({
  basePath: `${process.env.PREFIX}/optimize`,
  paths: {},
})
class OptimizationController {
  _status?: string;

  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, {optional: true})
    private response: Response,
    @inject('datasources.typeorm') private dataSource: TypeORMDataSource,
    @inject.context() private ctx: RequestContext,
  ) {
    this._status = undefined;
  }

  @authenticate('OPTIMIZE.refresh')
  @get('/refresh', {
    operationId: 'Optimization.refresh',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Refresh materialized views',
      },
    },
  })
  async refresh(@param.query.string('view') view?: string): Promise<void> {
    if (this._status !== undefined && this._status.indexOf('ERROR:') !== 0) {
      throw new HttpErrors.createError(
        409,
        `Optimization already running: ${this._status}`,
      );
    } else {
      this._status = 'Starting...';
      setTimeout(() => {
        (async () => {
          this._status = 'refresh_materialized_views';
          await this.dataSource.refresh_materialized_views(view);
          this._status = undefined;
        })().catch(err => {
          console.error(err);
          this._status = `ERROR: ${err}`;
        });
      }, 0);
    }
  }

  @authenticate('OPTIMIZE.index')
  @get('/index', {
    operationId: 'Optimization.index',
    tags: ['Optimization'],
    responses: {
      '200': {
        description: 'Ensure index is present on field `table_name.deep.field`',
      },
    },
  })
  async index(@param.query.string('field') field: string): Promise<void> {
    if (this._status !== undefined && this._status.indexOf('ERROR:') !== 0) {
      throw new HttpErrors.createError(
        409,
        `Optimization already running: ${this._status}`,
      );
    } else {
      this._status = 'Starting...';
      setTimeout(() => {
        (async () => {
          this._status = 'get repo';
          const field_split = field.split('.');
          const table = field_split[0];
          const repo = await this.ctx.get<IGenericRepository<IGenericEntity>>(
            `repositories.${table}`,
          );
          this._status = 'ensureIndex';
          await repo.ensureIndex(field_split.slice(1).join('.'));
          this._status = undefined;
        })().catch(err => {
          console.error(err);
          this._status = `ERROR: ${err}`;
        });
      }, 0);
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
    if (this._status === undefined) {
      return 'Ready';
    } else {
      return this._status;
    }
  }
}

export {OptimizationController};
