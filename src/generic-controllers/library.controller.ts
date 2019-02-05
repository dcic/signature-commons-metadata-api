import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { Filter } from '@loopback/repository';
import { get, getFilterSchemaFor, param, api } from '@loopback/rest';
import { Library as LibraryEntity, LibrarySchema, Signature } from '../models';
import { LibraryRepository } from '../repositories';
import { GenericControllerFactory } from './generic.controller';
import { Signature as SignatureController } from './signature.controller';

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
  async getSignatures(
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

  @authenticate('GET.libraries.signatures.value_counts')
  @get('/{id}/signatures/value_counts')
  async getStats(
    @param.path.string('id') id: string,
    @param.query.string('field') field: string
  ): Promise<any> {
    const field_escaped = escapeLiteral(field, '"')

    const results = await new Promise((resolve, reject) =>
      (this.genericRepository.dataSource.connector as any as PostgreSQLConnector).execute(`
        select
          libraries.meta->>'Primary Resource' as "Resource",
          signatures.meta->>$2 as ${field_escaped},
          count(signatures.meta->>$2) as "Number of Signatures"
        from
          signatures
          inner join libraries on libraries.uuid = signatures.libid
        where
          signatures.libid = $1
        group by
          "Resource",
          ${field_escaped}
        having
          count(signatures.meta->>$2) > 0
          and signatures.meta->>$2 <> ''
          and libraries.meta->>'Primary Resource' <> '';
      `, [id, field], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
    )

    return results
  }
}
