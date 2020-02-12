import { authenticate, AuthenticationBindings } from "@loopback/authentication";
import { inject } from "@loopback/core";
import { api, RequestContext, RestBindings, Response, get } from "@loopback/rest";
import { UserProfile } from "../models";
import { repository } from "@loopback/repository";
import { EntityRepository, SummaryRepository, SchemaRepository, SignatureRepository, LibraryRepository, ResourceRepository } from "../repositories";
import { IGenericEntity, IGenericRepository } from "../generic-controllers/generic.controller";
import { Library as LibraryController, Resource as ResourceController, Signature as SignatureController } from '../generic-controllers'

function makeTemplate<T>(
    templateString: string,
    templateVariables: T,
) {
  const keys = [...Object.keys(templateVariables).map((key) => key.replace(/ /g, '_')), 'PREFIX']
  const values = [...Object.values(templateVariables), process.env.PREFIX]
  let templateFunction = new Function(...keys, `return \`${templateString}\`;`)
  try {
    return templateFunction(...values)
  } catch (error) {
    return 'undefined'
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
//     if (typeof (m as any)[k] === 'string') {
//       let V
//       try {
//         V = makeTemplate((m as any)[k], o)
//       } catch {
//         return (false)
//       }
//       if (K.match(RegExp(V)) === null) {
//         return false
//       }
//     } else if (typeof (m as any)[k] === 'object') {
//       if ((m as any)[k]['ne'] !== undefined) {
//         if ((m as any)[k]['ne'] === K) {
//           return false
//         }
//       } else {
//         throw new Error(`'Operation not recognized ${JSON.stringify((m as any)[k])} ${JSON.stringify(m)} ${JSON.stringify(o)}`)
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
        'meta.Meta_Count': true,
      } as any,
    })
    if (counting_fields.length === 0) {
      return ({ meta_counts: {} })
    }
  
    // const meta_stats = {}
    const meta_counts = []
    for (const entry of counting_fields) {
      const k = entry.meta.Field_Name
      const model = this.tbl_to_repo(entry.meta.Table).entityClass
      const count = (await this.tbl_to_repo(entry.meta.Table).dataSource.distinct_value_counts(model, {
                        fields: [entry.meta.Field_Name],
                      } as any) as any)
      meta_counts.push({
        name: entry.meta.Preferred_Name || k,
        counts: (count as any)[k],
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
  
    const piecounts = {}
    for (const entry of piefields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass
      const meta_stats = (await (this.tbl_to_repo(entry.meta.Table)).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name],
      } as any))
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      ;(piecounts as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: ui_values.preferred_name[entry.meta.Table],
        stats: Object.entries((meta_stats as any)[entry.meta.Field_Name]).map(([key,val])=>(
          {counts: val, name: key}
        )),
        slice: entry.meta.Slice || 14,
      }
    }
    return { piecounts }
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
      const model = this.tbl_to_repo(entry.meta.Table).entityClass
      const meta_stats = (await (this.tbl_to_repo(entry.meta.Table)).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name],
        limit: 25,
      } as any))
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      ;(barcounts as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        key: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries((meta_stats as any)[entry.meta.Field_Name]).map(([key,val])=>(
          {counts: val, name: key}
        )),
      }
    }
    return {barcounts}
  }


  async get_wordcounts() {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Word_Count': true,
      } as any,
    })
    const wordcounts: any = {}
    for (const entry of counting_fields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass
      const meta_stats = (await (this.tbl_to_repo(entry.meta.Table)).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name],
        limit: 100,
      } as any))
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      ;(wordcounts as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        key: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries((meta_stats as any)[entry.meta.Field_Name]).map(([key,val])=>(
          {counts: val, name: key}
        )),
      }
    }
    return {wordcounts}
  }

  async get_histograms() {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Histogram': true,
      } as any,
    })
    const histograms: any = {}
    for (const entry of counting_fields) {
      const model = this.tbl_to_repo(entry.meta.Table).entityClass
      const meta_stats = (await (this.tbl_to_repo(entry.meta.Table)).dataSource.value_counts(model, {
        fields: [entry.meta.Field_Name],
      } as any))
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      ;(histograms as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        key: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: Object.entries((meta_stats as any)[entry.meta.Field_Name]).map(([key,val])=>(
          {counts: val, name: key}
        )),
      }
    }
    return {histograms}
  }

  async get_barscores() {
    const counting_fields = await this.schemaRepo.find({
      where: {
        'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
        'meta.Bar_Score': true,
      } as any,
    })
    const barscores: any = {}
    for (const entry of counting_fields) {
      const meta_scores = await (this.tbl_to_repo(entry.meta.Table)).find({
        where: {
          [entry.meta.Order_By]: {
            neq: null,
          }
        },
        order: [`${entry.meta.Order_By} DESC`],
        limit: 25,
      })
      const stats:Array<any> = []
      for (const value of meta_scores){
        const name = makeTemplate('${' + entry.meta.Field_Name + '}', value) as string
        const counts = makeTemplate('${' + entry.meta.Order_By + '}', value) as string
        stats.push({name, counts})
      }
      // await this.entityRepo.dataSource.connection.query('select blah from signatures where blah = :param', {param: ''})
      ;(barscores as any)[entry.meta.Preferred_Name || entry.meta.Field_Name] = {
        Preferred_Name: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        key: entry.meta.Preferred_Name_Singular || entry.meta.Preferred_Name || entry.meta.Field_Name,
        table: entry.meta.Table,
        stats: stats,
      }
    }
    return {barscores}
  }

  // async get_barscores() {
  //   const counting_fields = await this.schemaRepo.find({
  //     where: {
  //       'meta.$validator': '/dcic/signature-commons-schema/v5/meta/schema/counting.json',
  //       'meta.Bar_Score': true,
  //     } as any,
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
  //     } as any))
      
  //     const stats: any = {}
  //     for (const bar_meta of meta_stats) {
  //       const count = Number(makeTemplate('${' + entry.meta.Order_By + '}', bar_meta))
  //       const name = makeTemplate('${' + entry.meta.Field_Name + '}', bar_meta)
  //       stats[name] = 
  //       //const count = (meta_stats as any)[entry.meta.Field_Name][bar]
  //     }
  //     barscores[entry.meta.Field_Name] = Object.keys(stats).map((key) => ({ name: key, counts: stats[key] }))
  //   }
  //   return barscores
  // }

  
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

  async get_resource_signatures_count(schemas: any) {
    const resource_signature_count: any = []
    for (const resource of await this.resourceRepo.find()) {
      const {count} = await this.resourceController.signatures_count(
        this.libraryController,
        this.signatureController,
        resource.id
      )
      resource_signature_count.push({count, id: resource.id})
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
    // console.log(schemas)
    const resource_signature_count = await this.get_resource_signatures_count(schemas)
    // console.log(resource_signature_count)
    const { table_counts, ui_values: ui_val } = await this.get_counts(Object.keys(resource_signature_count).length, ui_values)
    // console.log(table_counts)
    const { meta_counts } = await this.get_metacounts()
    // console.log(meta_counts)
    const { piecounts } = await this.get_pie_stats(ui_val)
    // console.log(piecounts)
    // let signature_keys: any = {}
    // const { count } = await this.signatureRepo.count()
    // if (count > 0){
    //   signature_keys = await this.get_signature_keys()
    // }
    const { barcounts } = await this.get_barcounts()
    const { histograms } = await this.get_histograms()
    const { barscores } = await this.get_barscores()
    const { wordcounts } = await this.get_wordcounts()
    await this.summaryRepo.deleteAll()
    await this.summaryRepo.createAll([
      {
        id: 'schemas',
        value: schemas
      },
      {
        id: 'resource_signature_count',
        value: resource_signature_count
      },
      {
        id: 'table_counts',
        value: table_counts
      },
      {
        id: 'meta_counts',
        value: meta_counts
      },
      {
        id: 'piecounts',
        value: piecounts,
      },
      {
        id: 'wordcounts',
        value: wordcounts
      },
      {
        id: 'barcounts',
        value: barcounts
      },
      {
        id: 'barscores',
        value: barscores
      },
      {
        id: 'histograms',
        value: histograms
      }
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
