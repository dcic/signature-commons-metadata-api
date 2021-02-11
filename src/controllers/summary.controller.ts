import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {api, RequestContext, RestBindings, Response, get} from '@loopback/rest';
import {UserProfile} from '../models';
import {repository, Fields, Entity, Filter, Where} from '@loopback/repository';
import {
  EntityRepository,
  SummaryRepository,
  SchemaRepository,
  SignatureRepository,
  LibraryRepository,
  ResourceRepository,
} from '../repositories';
import {
  IGenericEntity,
  IGenericRepository,
} from '../generic-controllers/generic.controller';
import {
  Library as LibraryController,
  Resource as ResourceController,
  Signature as SignatureController,
} from '../generic-controllers';
import {Schema} from '../entities';
import {BackgroundProcessService} from '../services';

interface CountingSchema {
  // The name of the field
  Field_Name: string;
  // The expected datatype of that field
  Type: string;
  // Display name of the field on the landing page
  Preferred_Name?: string;
  // Source table
  Table: string;
  // MDI icon to use
  MDI_Icon?: string;
  // Count this field as part of the meta counts
  Meta_Count?: boolean;
  // Count this field as part of the Bbr chart
  Bar_Count?: boolean;
  // Count this field as part of the Pie chart
  Pie_Count?: boolean;
  // States that this field is a table not a metadata
  Table_Count: boolean;
  // Make this field visible on landing page
  Visible_On_Landing: boolean;
  // Make this field visible on admin page
  Visible_On_Admin: boolean;
  // Priority
  Priority?: number;
}

function makeTemplate<T>(templateString: string, templateVariables: T): string {
  const keys = [
    ...Object.keys(templateVariables).map(key => key.replace(/ /g, '_')),
    'PREFIX',
  ];
  const values = [...Object.values(templateVariables), process.env.PREFIX];
  const templateFunction = new Function(
    ...keys,
    `return \`${templateString}\`;`,
  );
  try {
    return templateFunction(...values);
  } catch (error) {
    return 'undefined';
  }
}

// function objectMatch<T>(
//   m: string,
//   o: T) {
//   if (m === undefined) {
//     return true
//   }
//   for (const k of Object.keys(m)) {
//     let K
//     try {
//       K = makeTemplate(k, o)
//     } catch {
//       return (false)
//     }
//     if (typeof (m)[k] === 'string') {
//       let V
//       try {
//         V = makeTemplate((m)[k], o)
//       } catch {
//         return (false)
//       }
//       if (K.match(RegExp(V)) === null) {
//         return false
//       }
//     } else if (typeof (m)[k] === 'object') {
//       if ((m)[k]['ne'] !== undefined) {
//         if ((m)[k]['ne'] === K) {
//           return false
//         }
//       } else {
//         throw new Error(`'Operation not recognized ${JSON.stringify((m)[k])} ${JSON.stringify(m)} ${JSON.stringify(o)}`)
//       }
//     }
//   }
//   return true
// }

// function findMatchedSchema<T>(
//   item: T,
//   schemas:Array<any>) {
//   const matched_schemas = schemas.filter(
//       (schema) => objectMatch(schema.match, item)
//   )
//   if (matched_schemas.length < 1) {
//     console.error('Could not match ui-schema for item', item)
//     return null
//   } else return matched_schemas[0]
// }

@api({
  basePath: `${process.env.PREFIX}/summary`,
  paths: {},
})
class SummaryController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE, {optional: true})
    private response: Response,
    @inject.context() private ctx: RequestContext,
    @repository(SummaryRepository) public summaryRepo: SummaryRepository,
    @repository(SchemaRepository) public schemaRepo: SchemaRepository,
    @repository(ResourceRepository) public resourceRepo: ResourceRepository,
    @repository(LibraryRepository) public libraryRepo: LibraryRepository,
    @repository(SignatureRepository) public signatureRepo: SignatureRepository,
    @repository(EntityRepository) public entityRepo: EntityRepository,
    @service(BackgroundProcessService) private bg: BackgroundProcessService,
    @inject('controllers.Library') private libraryController: LibraryController,
    @inject('controllers.Signature')
    private signatureController: SignatureController,
    @inject('controllers.Resource')
    private resourceController: ResourceController,
  ) {}

  tbl_to_repo(tbl: string): IGenericRepository<IGenericEntity> {
    return ({
      resources: this.resourceRepo,
      entities: this.entityRepo,
      signatures: this.signatureRepo,
      libraries: this.libraryRepo,
    } as any)[tbl];
  }

  async fetch_count(source: string): Promise<number> {
    return (await this.tbl_to_repo(source).count()).count;
  }

  async get_counting_fields(additionalWhere: {
    [key: string]: any;
  }): Promise<Array<Schema & {meta: any}>> {
    return (await this.schemaRepo.find({
      where: ({
        'meta.$validator': {
          like: '/%dcic/signature-commons-schema/%/meta/schema/counting.json',
        },
        ...additionalWhere,
      } as unknown) as Where<Schema>,
    })) as Array<Schema & {meta: any}>;
  }

  async get_counts(ui_values: any) {
    const counting_fields = await this.get_counting_fields({
      'meta.type': 'table',
    });
    if (counting_fields.length > 0) {
      if (ui_values.preferred_name === undefined) {
        ui_values.preferred_name = {};
      }
      const count_promise = counting_fields.map(async item => {
        const count_stats = await this.fetch_count(item.meta.model);
        // modify ui values preferred name id it does not exist
        if (ui_values.preferred_name[item.meta.model] === undefined) {
          ui_values.preferred_name[item.meta.model] = item.meta.text;
        }
        return {
          model: item.meta.model,
          name: item.meta.text,
          icon: item.meta.icon,
          group: item.meta.group,
          count: count_stats,
        };
      });

      const counts = await Promise.all(count_promise);
      return {counts, ui_values};
    }
    return {counts: {}, ui_values};
  }

  async get_metacounts() {
    const counting_fields = await this.get_counting_fields({
      'meta.type': 'meta-count',
    });
    if (counting_fields.length === 0) {
      return {counts: {}};
    }

    // const meta_stats = {}
    const counts = [];
    for (const entry of counting_fields) {
      const k = entry.meta.field;
      const model = this.tbl_to_repo(entry.meta.model).entityClass;
      const count = await this.tbl_to_repo(
        entry.meta.model,
      ).dataSource.distinct_value_counts(model, {
        fields: [entry.meta.field] as Fields<IGenericEntity>,
      });
      counts.push({
        model: entry.meta.model,
        name: entry.meta.text ?? k,
        count: count[k],
        icon: entry.meta.icon,
        group: entry.meta.group,
      });
    }
    counts.sort((a, b) => b.count - a.count);
    return {counts};
  }

  async get_visualization_count(type: string) {
    const fields = await this.get_counting_fields({
      'meta.type': type,
    });

    const counts: {
      [key: string]: {
        name: string;
        field: string;
        model: string;
        stats: Array<{
          count: number;
          name: string;
        }>;
        group: any;
        type: string;
      };
    } = {};

    for (const entry of fields) {
      const model = this.tbl_to_repo(entry.meta.model).entityClass;
      if (entry.meta.field !== 'resource') {
        const meta_stats = await this.tbl_to_repo(
          entry.meta.model,
        ).dataSource.value_counts(model, {
          fields: [entry.meta.field],
          limit: entry.meta.limit,
        } as Filter<Entity>);
        // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
        counts[entry.meta.text ?? entry.meta.field] = {
          name: entry.meta.text || entry.meta.field,
          field: entry.meta.search_field || entry.meta.field,
          model: entry.meta.model,
          stats: Object.entries(
            meta_stats[entry.meta.field] || {},
          ).map(([key, val]) => ({count: val, name: key})),
          group: entry.meta.group,
          type: entry.meta.type,
        };
      } else {
        const stats = await this.get_resource_signatures_count(
          entry.meta.search_field,
        );
        counts[entry.meta.text ?? entry.meta.field] = {
          name: entry.meta.text || entry.meta.field,
          field: entry.meta.field,
          model: entry.meta.model,
          stats,
          group: entry.meta.group,
          type: entry.meta.type,
        };
      }
    }
    return {counts};
  }

  async get_visualization_scores() {
    const fields = await this.get_counting_fields({
      'meta.type': 'score',
    });

    const scores: {
      [key: string]: {
        name: string;
        field: string;
        model: string;
        stats: Array<{
          count: number;
          name: string;
        }>;
        group: any;
      };
    } = {};

    for (const entry of fields) {
      const order = [`${entry.meta.order_by} ${entry.meta.order}`];
      const meta_scores = await this.tbl_to_repo(entry.meta.Table).find({
        where: {
          [entry.meta.order_by]: {
            neq: null,
          },
        },
        order,
        limit: entry.meta.limit,
      });
      const stats: Array<any> = [];
      for (const value of meta_scores) {
        const name = makeTemplate(
          '${' + entry.meta.search_field || entry.meta.field + '}',
          value,
        );
        const count = makeTemplate('${' + entry.meta.order_by + '}', value);
        stats.push({name, count: Number(count)});
      }
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      scores[entry.meta.text ?? entry.meta.field] = {
        name: entry.meta.text,
        field: entry.meta.search_field || entry.meta.field,
        model: entry.meta.model,
        stats: stats,
        group: entry.meta.group,
      };
    }
    return {scores};
  }

  async get_schemas() {
    return (
      await this.schemaRepo.find({
        where: {
          'meta.$validator': {
            like:
              '/%dcic/signature-commons-schema/%/meta/schema/ui-schema.json',
          },
        },
        fields: ['meta'],
      } as Filter<Schema>)
    ).map(({meta}) => meta);
  }

  async get_ui_values() {
    const ui_val = await this.schemaRepo.find({
      where: {
        'meta.$validator': {
          like: '/%dcic/signature-commons-schema/%/meta/schema/ui-schema.json',
        },
        'meta.landing': true,
      },
    } as Filter<Schema>);
    const ui_values = ui_val.length > 0 ? ui_val[0].meta.content : {};
    return {ui_values};
  }

  async get_resource_signatures_count(search_field: string) {
    const resource_signature_count: Array<{
      count: number;
      name: string;
      id: string;
    }> = [];
    for (const resource of await this.resourceRepo.find()) {
      const {count} = await this.resourceController.signatures_count(
        this.libraryController,
        this.signatureController,
        resource.id,
      );
      const name = makeTemplate('${' + search_field + '}', resource);
      resource_signature_count.push({count, name, id: resource.id});
    }
    return resource_signature_count;
  }

  @authenticate('POST.refresh_summary')
  @get('/refresh', {
    operationId: 'refresh',
    responses: {
      '200': {
        description: 'Compute the summary',
      },
    },
  })
  async refresh(): Promise<void> {
    await this.bg.spawn(async () => {
      await this.bg.setStatus('get_ui_values');
      const {ui_values} = await this.get_ui_values();
      // Check if it has library_name and resource_from_library
      await this.bg.setStatus('get_schemas');
      const schemas = await this.get_schemas();
      await this.bg.setStatus('get_counts');
      const {counts: models} = await this.get_counts(ui_values);
      await this.bg.setStatus('get_metacounts');
      const {counts: meta} = await this.get_metacounts();
      const count_charts: {[key: string]: {}} = {};
      for (const type of ['bar', 'pie', 'word']) {
        await this.bg.setStatus(`get_${type}_stats`);
        const {counts} = await this.get_visualization_count(type);
        count_charts[type] = counts;
      }
      await this.bg.setStatus(`get_scores`);
      const {scores} = await this.get_visualization_scores();
      await this.bg.setStatus('Refreshing summary...');
      await this.summaryRepo.deleteAll();
      await this.summaryRepo.createAll([
        {
          id: 'schemas',
          value: schemas,
        },
        {
          id: 'model_counts',
          value: models,
        },
        {
          id: 'meta_counts',
          value: meta,
        },
        {
          id: 'count_charts',
          value: count_charts,
        },
        {
          id: 'scores',
          value: scores,
        },
      ]);
    });
  }

  @authenticate('GET.summary')
  @get('', {
    operationId: 'get',
    responses: {
      '200': {
        description: 'Get the latest computed summary',
        content: {
          'application/json': {
            type: 'object',
          },
        },
      },
    },
  })
  async summary(): Promise<any> {
    const summary: any = {};
    for (const {id, value} of await this.summaryRepo.find()) {
      summary[id] = value;
    }
    return summary;
  }

  @authenticate('GET.refresh_status')
  @get('/status', {
    operationId: 'Summary.status',
    responses: {
      '200': {
        description: 'The status of the last refresh_summary request',
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

export {SummaryController};
