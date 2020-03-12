import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { Filter, Where, repository } from '@loopback/repository';
import { get, getFilterSchemaFor, param, getWhereSchemaFor } from '@loopback/rest';
import { Library as LibraryEntity, LibrarySchema, Signature, Resource } from '../entities';
import { LibraryRepository, ResourceRepository } from '../repositories';
import { GenericControllerFactory, IGenericRepository } from './generic.controller';
import { Signature as SignatureController } from './signature.controller';
import { AnyObject, Count } from 'loopback-datasource-juggler';
import { escapeLiteral, buildLimit } from '../util/sql_building';
import debug from '../util/debug'

const GenericLibraryController = GenericControllerFactory<
  LibraryEntity,
  LibraryRepository
>({
  GenericRepository: LibraryRepository,
  GenericEntity: LibraryEntity,
  GenericEntitySchema: LibrarySchema,
  modelName: 'Library',
  basePath: `${process.env.PREFIX}/libraries`,
})

export class Library extends GenericLibraryController {
  @authenticate('GET.libraries.resource')
  @get('/{id}/resource')
  async getLibrary(
    @repository(ResourceRepository) resourceRepository: IGenericRepository<Resource>,
    @param.path.string('id') id: string
  ): Promise<Resource> {
    const library = await this.genericRepository.findById(id, { fields: ['resource'] } as Filter<LibraryEntity>)
    return await library._resource
  }

  @authenticate('GET.libraries.signatures')
  @get('/{id}/signatures')
  async signatures(
    @inject('controllers.Signature') signatureController: SignatureController,
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature)) filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str: string = '',
    @param.query.boolean('contentRange') contentRange: boolean = true,
  ): Promise<Signature[]> {
    if (filter_str !== '' && filter == null)
      filter = JSON.parse(filter_str)

    const signatures = await signatureController.find({
      filter: {
        ...(filter || {}),
        where: {
          ...((filter || {}).where || {}),
          library: id
        }
      },
      contentRange,
    })

    return signatures
  }

  @authenticate('GET.libraries.signatures.count')
  @get('/{id}/signatures/count')
  async signatures_count(
    @inject('controllers.Signature') signatureController: SignatureController,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Signature)) where?: Where<Signature>,
    @param.query.string('where_str') where_str: string = '',
  ): Promise<Count> {
    if (where_str !== '' && where == null)
      where = JSON.parse(where_str)

    const count = await signatureController.count(
      {
        ...(where || {}),
        library: id
      },
    )

    return count
  }

  @authenticate('GET.libraries.signatures.key_count')
  @get('/{id}/signatures/key_count')
  async signatures_key_counts(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature)) filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str: string = '',
  ): Promise<AnyObject> {
    if (filter_str !== '' && filter == null)
      filter = JSON.parse(filter_str)

    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, sum(r.count) as count
      from
        "libraries_signatures_key_value_counts" as r
      where
        r.library = ${escapeLiteral(id)}
      group by
        r.key
      ${where_meta_clause ? `
        having
          ${where_meta_clause}
      ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await (await this.genericRepository.dataSource.getConnection()).query(query, [])

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: parseInt(count)
    }), {})
  }

  @authenticate('GET.libraries.signatures.value_count')
  @get('/{id}/signatures/value_count')
  async signatures_value_counts(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Signature)) filter?: Filter<Signature>,
    @param.query.string('filter_str') filter_str: string = '',
  ): Promise<AnyObject> {
    if (filter_str !== '' && filter == null)
      filter = JSON.parse(filter_str)

    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, r.value, r.count
      from
        "libraries_signatures_key_value_counts" as r
      where
        r.library = ${escapeLiteral(id)}
        ${where_meta_clause ? `
          and
            ${where_meta_clause}
        ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await (await this.genericRepository.dataSource.getConnection()).query(query, [])

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, value, count }: any) => ({
      ...grouped,
      [key]: {
        ...grouped[key],
        [value]: parseInt(count),
      },
    }), {})
  }
}
