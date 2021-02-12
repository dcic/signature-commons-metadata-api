import {QueryRunner} from 'typeorm';
import {Query} from '../entities/query.model';
import {QueryResult} from '../entities/query_result.model';
import {QueryMetaC} from '../types/schemas';
import {geneset_enrichment} from './enrichment';

export async function dispatch(
  queryRunner: QueryRunner,
  query: Query,
): Promise<QueryResult> {
  console.log(`checking ${JSON.stringify(query)}`);
  const meta = QueryMetaC.from(query.meta);
  if (meta.method === 'geneset_enrichment') {
    console.log(`Performing geneset enrichment with ${meta.entities}`);
    return geneset_enrichment(queryRunner, query);
    // } else if (meta.method === 'up_down_geneset_enrichment') {
    //   console.log(`Performing up_down geneset enrichment with ${meta.up_entities} & ${meta.down_entities}`)
  } else {
    // shouldn't be possible to get here
    throw new Error(`Unhandled QueryMeta`);
  }
}
