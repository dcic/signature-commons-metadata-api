import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  api,
  RequestContext,
  RestBindings,
  Response,
  get,
  HttpErrors,
} from '@loopback/rest';
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
  _status?: string;

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
    @inject('controllers.Library') private libraryController: LibraryController,
    @inject('controllers.Signature')
    private signatureController: SignatureController,
    @inject('controllers.Resource')
    private resourceController: ResourceController,
  ) {
    this._status = undefined;
  }

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
  }): Promise<Array<Schema & {meta: CountingSchema}>> {
    return (await this.schemaRepo.find({
      where: ({
        'meta.$validator': {
          like: '/%dcic/signature-commons-schema/%/meta/schema/counting.json',
        },
        ...additionalWhere,
      } as unknown) as Where<Schema>,
    })) as Array<Schema & {meta: CountingSchema}>;
  }

  async get_counts(resource_count: any, ui_values: any) {
    const counting_fields = await this.get_counting_fields({
      'meta.Table_Count': true,
    });
    let table_counts;
    if (counting_fields.length > 0) {
      if (ui_values.preferred_name === undefined) {
        ui_values.preferred_name = {};
      }
      const count_promise = counting_fields
        .filter(item => item.meta.Field_Name !== 'resources')
        .map(async item => {
          const count_stats = await this.fetch_count(item.meta.Field_Name);
          ui_values.preferred_name[item.meta.Field_Name] =
            item.meta.Preferred_Name;
          return {
            table: item.meta.Field_Name,
            preferred_name: item.meta.Preferred_Name,
            icon: item.meta.MDI_Icon,
            Visible_On_Landing: item.meta.Visible_On_Landing,
            counts: count_stats,
          };
        });
      table_counts = await Promise.all(count_promise);
      const resource_field = counting_fields.filter(
        item => item.meta.Field_Name === 'resources',
      );
      if (resource_field.length > 0) {
        table_counts = [
          ...table_counts,
          {
            table: resource_field[0].meta.Field_Name,
            preferred_name: resource_field[0].meta.Preferred_Name,
            icon: resource_field[0].meta.MDI_Icon,
            Visible_On_Landing: resource_field[0].meta.Visible_On_Landing,
            counts: resource_count,
          },
        ];
        ui_values.preferred_name[resource_field[0].meta.Field_Name] =
          resource_field[0].meta.Preferred_Name;
      }
    } else {
      if (ui_values.preferred_name !== undefined) {
        const count_promise = Object.keys(ui_values.preferred_name)
          .filter(key => key !== 'resources')
          .map(async key => {
            const count_stats = await this.fetch_count(key);
            return {
              table: key,
              preferred_name: ui_values.preferred_name[key],
              Visible_On_Landing: count_stats > 0,
              icon: 'mdi-arrow-top-right-thick',
              counts: count_stats,
            };
          });
        table_counts = await Promise.all(count_promise);
        if ('resources' in ui_values.preferred_name) {
          table_counts = [
            ...table_counts,
            {
              table: 'resources',
              preferred_name: ui_values.preferred_name['resources'],
              Visible_On_Landing: resource_count > 0,
              icon: 'mdi-arrow-top-right-thick',
              counts: resource_count,
            },
          ];
        }
      }
    }
    return {table_counts, ui_values};
  }

  async get_metacounts() {
    const counting_fields = await this.get_counting_fields({
      'meta.Meta_Count': true,
    });
    if (counting_fields.length === 0) {
      return {meta_counts: {}};
    }

    // const meta_stats = {}
    const meta_counts = [];
    for (const entry of counting_fields) {
      const k = entry.meta.Field_Name;
      const model = this.tbl_to_repo(entry.meta.Table).entityClass;
      const count = await this.tbl_to_repo(
        entry.meta.Table,
      ).dataSource.distinct_value_counts(model, {
        fields: [entry.meta.Field_Name] as Fields<IGenericEntity>,
      });
      meta_counts.push({
        name: entry.meta.Preferred_Name ?? k,
        counts: count[k],
        icon: entry.meta.MDI_Icon,
        Preferred_Name: entry.meta.Preferred_Name ?? entry.meta.Field_Name,
      });
    }
    meta_counts.sort((a, b) => b.counts - a.counts);
    return {meta_counts};
  }

  async get_pie_stats(ui_values: any) {
    const piefields = await this.get_counting_fields({
      'meta.Pie_Count': true,
    });

    const piecounts: {
      [key: string]: {
        Preferred_Name: string;
        table: string;
        stats: Array<{
          counts: number;
          name: string;
        }>;
        slice: number;
        priority: number;
      };
    } = {};
    for (const entry of piefields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass;
      const meta_stats = await this.tbl_to_repo(
        entry.meta.Table,
      ).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name],
      } as Filter<Entity>);
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      piecounts[entry.meta.Preferred_Name ?? entry.meta.Field_Name] = {
        Preferred_Name:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries(
          meta_stats[entry.meta.Field_Name] || {},
        ).map(([key, val]) => ({counts: val, name: key})),
        slice: entry.meta.Slice || 14,
        priority: entry.meta.Priority ?? 1,
      };
    }
    return {piecounts};
  }

  async get_barcounts() {
    const counting_fields = await this.get_counting_fields({
      'meta.Bar_Count': true,
    });
    const barcounts: any = {};
    for (const entry of counting_fields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass;
      const meta_stats = await this.tbl_to_repo(
        entry.meta.Table,
      ).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name] as Fields<IGenericEntity>,
        limit: 25,
      });
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      barcounts[entry.meta.Preferred_Name ?? entry.meta.Field_Name] = {
        Preferred_Name:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        key:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries(
          meta_stats[entry.meta.Field_Name] || {},
        ).map(([key, val]) => ({counts: val, name: key})),
        priority: entry.meta.Priority ?? 1,
      };
    }
    return {barcounts};
  }

  async get_wordcounts() {
    const counting_fields = await this.get_counting_fields({
      'meta.Word_Count': true,
    });
    const wordcounts: any = {};
    for (const entry of counting_fields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass;
      const meta_stats = await this.tbl_to_repo(
        entry.meta.Table,
      ).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name] as Fields<IGenericEntity>,
        limit: 100,
      });
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      wordcounts[entry.meta.Preferred_Name ?? entry.meta.Field_Name] = {
        Preferred_Name:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        key:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries(
          meta_stats[entry.meta.Field_Name] || {},
        ).map(([key, val]) => ({counts: val, name: key})),
        priority: entry.meta.Priority ?? 1,
      };
    }
    return {wordcounts};
  }

  async get_histograms() {
    const counting_fields = await this.get_counting_fields({
      'meta.Histogram': true,
    });
    const histograms: any = {};
    for (const entry of counting_fields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass;
      const meta_stats = await this.tbl_to_repo(
        entry.meta.Table,
      ).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name] as Fields<IGenericEntity>,
      });
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      histograms[entry.meta.Preferred_Name ?? entry.meta.Field_Name] = {
        Preferred_Name:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        key:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries(
          meta_stats[entry.meta.Field_Name] || {},
        ).map(([key, val]) => ({counts: val, name: key})),
        priority: entry.meta.Priority ?? 1,
      };
    }
    return {histograms};
  }

  async get_barscores() {
    const counting_fields = await this.get_counting_fields({
      'meta.Bar_Score': true,
    });
    const barscores: any = {};
    for (const entry of counting_fields) {
      const order = [entry.meta.Order_By + ' DESC'];
      const meta_scores = await this.tbl_to_repo(entry.meta.Table).find({
        where: {
          [entry.meta.Order_By]: {
            neq: null,
          },
        },
        order,
        limit: 25,
      });
      const stats: Array<any> = [];
      for (const value of meta_scores) {
        const name = makeTemplate('${' + entry.meta.Field_Name + '}', value);
        const counts = makeTemplate('${' + entry.meta.Order_By + '}', value);
        stats.push({name, counts: Number(counts)});
      }
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      barscores[entry.meta.Preferred_Name ?? entry.meta.Field_Name] = {
        Preferred_Name:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        key:
          entry.meta.Preferred_Name_Singular ||
          entry.meta.Preferred_Name ||
          entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: stats,
        priority: entry.meta.Priority ?? 1,
      };
    }
    return {barscores};
  }

  // async get_barscores() {
  //   const counting_fields = await this.schemaRepo.find({
  //     where: {
  //       'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
  //       'meta.Bar_Score': true,
  //     },
  //   })
  //   const barscores: any = {}
  //   for (const entry of counting_fields) {
  //     const meta_stats = (await (this.tbl_to_repo(entry.meta.Table)).find({
  //       where: {
  //         [entry.meta.Order_By]: {
  //           neq: null
  //         }
  //       },
  //       order: `${entry.meta.Order_By} DESC`,
  //       limit: 25,
  //     }))

  //     const stats: any = {}
  //     for (const bar_meta of meta_stats) {
  //       const count = Number(makeTemplate('${' + entry.meta.Order_By + '}', bar_meta))
  //       const name = makeTemplate('${' + entry.meta.Field_Name + '}', bar_meta)
  //       stats[name] =
  //       //const count = (meta_stats)[entry.meta.Field_Name][bar]
  //     }
  //     barscores[entry.meta.Field_Name] = Object.keys(stats).map((key) => ({ name: key, counts: stats[key] }))
  //   }
  //   return barscores
  // }

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

  async get_resource_signatures_count(schemas: any) {
    const resource_signature_count: any = [];
    for (const resource of await this.resourceRepo.find()) {
      const {count} = await this.resourceController.signatures_count(
        this.libraryController,
        this.signatureController,
        resource.id,
      );
      resource_signature_count.push({count, id: resource.id});
    }
    return resource_signature_count;
  }

  @authenticate('POST.refresh_summary')
  @get('/refresh', {
    operationId: 'Summary.refresh',
    responses: {
      '200': {
        description: 'Compute the summary',
      },
    },
  })
  async refresh(): Promise<void> {
    if (this._status !== undefined && this._status.indexOf('ERROR:') !== 0) {
      throw new HttpErrors.Conflict(`Summary.refresh already running: ${this._status}`);
    } else {
      this._status = 'Starting...';
      setTimeout(() => {
        (async () => {
          this._status = 'get_ui_values';
          const {ui_values} = await this.get_ui_values();
          // Check if it has library_name and resource_from_library
          this._status = 'get_schemas';
          const schemas = await this.get_schemas();
          // console.log(schemas)
          this._status = 'get_resource_signatures_count';
          const resource_signature_count = await this.get_resource_signatures_count(
            schemas,
          );
          // console.log(resource_signature_count)
          this._status = 'get_counts';
          const {table_counts, ui_values: ui_val} = await this.get_counts(
            Object.keys(resource_signature_count).length,
            ui_values,
          );
          // console.log(table_counts)
          this._status = 'get_metacounts';
          const {meta_counts} = await this.get_metacounts();
          // console.log(meta_counts)
          this._status = 'get_pie_stats';
          const {piecounts} = await this.get_pie_stats(ui_val);
          // console.log(piecounts)
          // let signature_keys: any = {}
          // const { count } = await this.signatureRepo.count()
          // if (count > 0){
          //   signature_keys = await this.get_signature_keys()
          // }
          this._status = 'get_barcounts';
          const {barcounts} = await this.get_barcounts();
          this._status = 'get_histograms';
          const {histograms} = await this.get_histograms();
          this._status = 'get_barscores';
          const {barscores} = await this.get_barscores();
          this._status = 'get_wordcounts';
          const {wordcounts} = await this.get_wordcounts();
          this._status = 'Refreshing summary...';
          await this.summaryRepo.deleteAll();
          await this.summaryRepo.createAll([
            {
              id: 'schemas',
              value: schemas,
            },
            {
              id: 'resource_signature_count',
              value: resource_signature_count,
            },
            {
              id: 'table_counts',
              value: table_counts,
            },
            {
              id: 'meta_counts',
              value: meta_counts,
            },
            {
              id: 'piecounts',
              value: piecounts,
            },
            {
              id: 'wordcounts',
              value: wordcounts,
            },
            {
              id: 'barcounts',
              value: barcounts,
            },
            {
              id: 'barscores',
              value: barscores,
            },
            {
              id: 'histograms',
              value: histograms,
            },
          ]);
          this._status = undefined;
        })().catch(err => {
          console.error(err);
          this._status = `ERROR: ${err}`;
        });
      }, 0);
    }
  }

  @authenticate('GET.summary')
  @get('', {
    operationId: 'Summary.get',
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
    if (this._status === undefined) {
      return 'Ready';
    } else {
      return this._status;
    }
  }
}

export {SummaryController};
