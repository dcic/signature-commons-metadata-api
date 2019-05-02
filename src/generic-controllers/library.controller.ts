import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { Filter } from '@loopback/repository';
import { get, getFilterSchemaFor, param, api } from '@loopback/rest';
import { Library as LibraryEntity, LibrarySchema, Signature } from '../models';
import { LibraryRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller';
import { Signature as SignatureController } from './signature.controller';
import { AnyObject } from 'loopback-datasource-juggler';
import { buildLimit } from '../util/sql_building';
import debug from '../util/debug'

const GenericLibraryController = GenericControllerFactory<
  LibraryEntity,
  LibraryRepository
>({
  GenericRepository: LibraryRepository,
  GenericEntity: LibraryEntity,
  GenericEntitySchema: LibrarySchema,
  modelName: 'Library',
  basePath: '/signature-commons-metadata-api/libraries',
})

interface PostgreSQLConnector {
  execute(sql: string, params: any[], callback: (err: Error, result: string) => void): void
}

function escapeLiteral(str: string, escape_val: string = '\'') {
  var hasBackslash = false;
  var escaped = escape_val;
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c === escape_val) {
      escaped += c + c;
    } else if (c === '\\') {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }
  escaped += escape_val;
  if (hasBackslash === true) {
    escaped = ' E' + escaped;
  }
  return escaped;
}

export class Library extends GenericLibraryController {
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

  @authenticate('GET.libraries.signatures.key_count')
  @get('/{id}/signatures/key_count')
  async key_counts(
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

    const results = await (
      new Promise((resolve, reject) =>
        this.genericRepository.dataSource.connector.execute(query, [],
          (err: any, result: any) => {
            if (err) reject(err)
            else resolve(result)
          }
        )
      )
    )

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: count
    }), {})
  }

  @authenticate('GET.libraries.signatures.value_count')
  @get('/{id}/signatures/value_count')
  async value_counts(
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

    const results = await (
      new Promise((resolve, reject) =>
        this.genericRepository.dataSource.connector.execute(query, [],
          (err: any, result: any) => {
            if (err) reject(err)
            else resolve(result)
          }
        )
      )
    )

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, value, count }: any) => ({
      ...grouped,
      [key]: {
        ...grouped[key],
        [value]: count,
      },
    }), {})
  }
}
