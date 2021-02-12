import {EntityManager, QueryRunner} from 'typeorm';
import {Query} from '../entities/query.model';
import {QueryResult} from '../entities/query_result.model';

async function ensure_transaction<T>(
  queryRunner: QueryRunner,
  callback: (entityManager: EntityManager) => Promise<T>,
) {
  if (queryRunner.isTransactionActive) {
    return callback(queryRunner.manager);
  } else {
    return queryRunner.manager.transaction(callback);
  }
}

export async function geneset_enrichment(
  queryRunner: QueryRunner,
  query: Query,
): Promise<QueryResult> {
  return ensure_transaction(queryRunner, async entityManager => {
    try {
      await entityManager.query('SET CONSTRAINTS ALL DEFERRED');
      const [{n_results}] = await entityManager.query(`
        with rows as (
          insert into signature_result (
            query_result_id,
            signature_id,
            created,
            meta
          )
          select
            '${query.id}' as query_result_id,
            signature_id,
            now() as created,
            (
                  jsonb_build_object('overlap', to_jsonb(a))
              ||  jsonb_build_object('oddsRatio', to_jsonb(
                    case
                      when (b*d) != 0 then ((a * c) / (b * d))
                      else null
                    end
                  ))
            ) as meta
          from (
            select
              signature_id,
              n_overlap as a,
              n_input - n_overlap as b,
              n_signature - n_overlap as c,
              n_background - n_signature - n_input + n_overlap as d
            from (
              with
                q1 as (
                  select jsonb_array_elements(query.meta->'entities')
                  from query
                  where query.id = '${query.id}'
                )
              select
                signature_id,
                (select count(*) from q1) as n_input,
                (select count(*) from "entity") as n_background,
                n_signature,
                n_overlap
              from (
                select
                  signature_id,
                  count(*) as n_signature,
                  count(*) filter (where to_jsonb(entity_id::text) in (select * from q1)) as n_overlap
                from
                  signature_entity
                group by signature_id
              ) as q2
            ) as q12
          ) as q112
          returning 1
        )
        select count(*) as n_results from rows
      `);
      console.log(n_results);
      const query_result = new QueryResult();
      query_result.id = query.id;
      query_result.meta = {
        $schema: '/query_result/geneset.json',
        n_results,
      };
      query_result._query = query;
      return await entityManager.save(query_result);
    } catch (e) {
      console.error(e);
      const query_result = new QueryResult();
      query_result.id = query.id;
      query_result.meta = {
        $schema: '/query_result/geneset.json',
        error: e + '',
      };
      query_result._query = query;
      return await entityManager.save(query_result);
    }
  });
}
