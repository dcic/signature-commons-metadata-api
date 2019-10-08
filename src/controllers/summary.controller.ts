import { authenticate, AuthenticationBindings } from "@loopback/authentication";
import { inject } from "@loopback/core";
import { api, RequestContext, RestBindings, Response, get } from "@loopback/rest";
import { UserProfile } from "../models";
import { repository } from "@loopback/repository";
import { EntityRepository, SummaryRepository, SchemaRepository, SignatureRepository, LibraryRepository, ResourceRepository } from "../repositories";
import { IGenericEntity, IGenericRepository } from "../generic-controllers/generic.controller";
import { Library as LibraryController, Resource as ResourceController, Signature as SignatureController } from '../generic-controllers'

@api({
  basePath: `${process.env.PREFIX}/summary`,
  paths: {}
})
class SummaryController {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject.context() private ctx: RequestContext,
    @repository(SummaryRepository) public summaryRepo: SummaryRepository,
    @repository(SchemaRepository) public schemaRepo: SchemaRepository,
    @repository(ResourceRepository) public resourceRepo: ResourceRepository,
    @repository(LibraryRepository) public libraryRepo: LibraryRepository,
    @repository(SignatureRepository) public signatureRepo: SignatureRepository,
    @repository(EntityRepository) public entityRepo: EntityRepository,
    @inject('controllers.Library') private libraryController: LibraryController,
    @inject('controllers.Signature') private signatureController: SignatureController,
    @inject('controllers.Resource') private resourceController: ResourceController,
  ) { }

  tbl_to_repo(tbl: string): IGenericRepository<IGenericEntity> {
    return ({
      resources: this.resourceRepo,
      entities: this.entityRepo,
      signatures: this.signatureRepo,
      libraries: this.libraryRepo,
    } as any)[tbl]
  }

  async fetch_count(source: string): Promise<number> {
    return (await this.tbl_to_repo(source).count()).count
  }

  async get_counts(resource_count: any, ui_values: any) {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Table_Count': true,
      } as any,
    })
    let table_counts
    if (counting_fields.length > 0) {
      if (ui_values.preferred_name === undefined) {
        ui_values.preferred_name = {}
      }
      const count_promise = counting_fields.filter((item) => item.meta.Field_Name !== 'resources').map(async (item) => {
        const count_stats = await this.fetch_count(item.meta.Field_Name)
        ui_values.preferred_name[item.meta.Field_Name] = item.meta.Preferred_Name
        return {
          table: item.meta.Field_Name,
          preferred_name: item.meta.Preferred_Name,
          icon: item.meta.MDI_Icon,
          Visible_On_Landing: item.meta.Visible_On_Landing,
          counts: count_stats,
        }
      })
      table_counts = await Promise.all(count_promise)
      const resource_field = counting_fields.filter((item) => item.meta.Field_Name === 'resources')
      if (resource_field.length > 0) {
        table_counts = [...table_counts, {
          table: resource_field[0].meta.Field_Name,
          preferred_name: resource_field[0].meta.Preferred_Name,
          icon: resource_field[0].meta.MDI_Icon,
          Visible_On_Landing: resource_field[0].meta.Visible_On_Landing,
          counts: resource_count,
        }]
        ui_values.preferred_name[resource_field[0].meta.Field_Name] = resource_field[0].meta.Preferred_Name
      }
    } else {
      if (ui_values.preferred_name !== undefined) {
        const count_promise = Object.keys(ui_values.preferred_name).filter((key) => key !== 'resources').map(async (key) => {
          const count_stats = await this.fetch_count(key)
          return {
            table: key,
            preferred_name: ui_values.preferred_name[key],
            Visible_On_Landing: count_stats > 0,
            icon: 'mdi-arrow-top-right-thick',
            counts: count_stats,
          }
        })
        table_counts = await Promise.all(count_promise)
        if ('resources' in ui_values.preferred_name) {
          table_counts = [...table_counts, {
            table: 'resources',
            preferred_name: ui_values.preferred_name['resources'],
            Visible_On_Landing: resource_count > 0,
            icon: 'mdi-arrow-top-right-thick',
            counts: resource_count,
          }]
        }
      }
    }
    return { table_counts, ui_values }
  }
  
  async get_metacounts() {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Table_Count': true,
      } as any,
    })
    if (counting_fields.length === 0) {
      return ({ meta_counts: {} })
    }
  
    const meta_stats = {}
    const meta_counts = []
    for (const entry of counting_fields) {
      Object.assign(
        meta_stats,
        (await this.tbl_to_repo(entry.meta.Table)).value_counts({
          fields: [entry.meta.Field_Name],
        } as any),
      )
      meta_counts.push({
        name: entry.meta.Preferred_Name,
        counts: Object.keys((meta_stats as any)[entry.meta.Field_Name] || {}).length,
        icon: entry.meta.MDI_Icon,
        Preferred_Name: entry.meta.Preferred_Name || entry.meta.Field_Name 
      })
    }
    meta_counts.sort((a, b) => b.counts - a.counts)
    return { meta_counts }
  }
  
  async get_pie_stats(ui_values: any) {
    const piefields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Pie_Count': true,
      } as any,
    })
  
    const meta_stats = {}
    const pie_fields_and_stats = {}
    for (const entry of piefields) {
      Object.assign(
        meta_stats,
        (await this.tbl_to_repo(entry.meta.Table)).value_counts({
          fields: [entry.meta.Field_Name],
        } as any),
      )
      ;(pie_fields_and_stats as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: ui_values.preferred_name[entry.meta.Table],
        stats: (meta_stats as any)[entry.meta.Field_Name],
        slice: entry.meta.Slice || 14,
      }
    }
    return { pie_fields_and_stats }
  }
  
  async get_barcounts() {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Bar_Count': true,
      } as any,
    })
    const barcounts: any = {}
    for (const entry of counting_fields) {
      const meta_stats = (await this.tbl_to_repo(entry.meta.Table)).value_counts({
        fields: [entry.meta.Field_Name],
      } as any)
      
      const stats: any = {}
      for (const bar in meta_stats) {
        const count = (meta_stats as any)[entry.meta.Field_Name][bar]
        if (bar === '2017b') {
          if (stats['2017'] === undefined) {
            stats['2017'] = count
          } else {
            stats['2017'] = stats['2017'] + count
          }
        } else {
          if (stats[bar] === undefined) {
            stats[bar] = count
          } else {
            stats[bar] = stats[bar] + count
          }
        }
      }
      barcounts[entry.meta.Field_Name] = Object.keys(stats).map((key) => ({ name: key, counts: stats[key] }))
    }
    return barcounts
  }
  
  async get_signature_keys() {
    const libraries = await this.libraryRepo.find({ fields: [ 'id' ] as any })
    const signature_keys: any = {}
    for (const { id } of libraries) {
      const fields = await this.libraryController.signatures_key_counts(id)
      signature_keys[id] = Object.keys(fields)
    }
    return signature_keys
  }
  
  async get_schemas() {
    return (
      await this.schemaRepo.find({
        where: {
          'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/ui-schema.json',
        },
        fields: ['meta']
      } as any)
    ).map(({ meta }) => meta)
  }
  
  async get_ui_values() {
    const ui_val = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/landing-ui.json',
        'meta.landing': true,
      },
    } as any)
    const ui_values = ui_val.length > 0 ? ui_val[0].meta.content : {}
    return { ui_values }
  }

  async get_resource_signatures_count() {
    const resource_signature_count: any = {}
    for (const resource of await this.resourceRepo.find({ fields: ['id'] } as any)) {
      resource_signature_count[resource.id] = await this.resourceController.signatures_count(
        this.libraryController,
        this.signatureController,
        resource.id
      )
    }
    return resource_signature_count
  }

  @authenticate('POST.refresh_summary')
  @get('/refresh', {
    operationId: 'refresh',
    responses: {
      '200': {
        description: 'Compute the summary'
      }
    }
  })
  async refresh(): Promise<void> {
    const { ui_values } = await this.get_ui_values()
    // Check if it has library_name and resource_from_library
    const schemas = await this.get_schemas()
    const resource_signature_count = await this.get_resource_signatures_count()
    const { table_counts, ui_values: ui_val } = await this.get_counts(Object.keys(resource_signature_count).length, ui_values)
    const { meta_counts } = await this.get_metacounts()
    const { pie_fields_and_stats } = await this.get_pie_stats(ui_val)
    let signature_keys: any = {}
    const { count } = await this.signatureRepo.count()
    if (count > 0){
      signature_keys = await this.get_signature_keys()
    }
    const { barcounts } = await this.get_barcounts()

    await this.summaryRepo.deleteAll()
    await this.summaryRepo.createAll([
      {
        id: 'table_counts',
        value: table_counts,
      },
      {
        id: 'meta_counts',
        value: meta_counts,
      },
      {
        id: 'resource_signature_count',
        value: resource_signature_count,
      },
      {
        id: 'pie_fields_and_stats',
        value: pie_fields_and_stats,
      },
      {
        id: 'barcounts',
        value: barcounts,
      },
      {
        id: 'signature_keys',
        value: signature_keys,
      },
      {
        id: 'ui_values',
        value: ui_values,
      },
      {
        id: 'schemas',
        value: schemas,
      },
    ])
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
          }
        }
      }
    }
  })
  async summary(): Promise<any> {
    const summary: any = {}
    for (const { id, value } of await this.summaryRepo.find()) {
      summary[id] = value
    }
    return summary
  }
}

export { SummaryController };
