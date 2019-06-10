import { MigrationInterface, QueryRunner } from "typeorm";

export class schema1560196298992 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      create index schemas_meta_gin_index
      on schemas using gin ( meta );
    `)
    await queryRunner.query(`
      create index schemas_meta_gist_fts_index
      on schemas using gist ( to_tsvector('english', meta) );
    `)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW schemas_key_value_counts
      AS
      WITH RECURSIVE r AS (
              SELECT v.key,
                v.value
                FROM schemas,
                LATERAL jsonb_each(schemas.meta) v(key, value)
            UNION ALL
              SELECT _r.key,
                _r.value
                FROM r r_1
                  CROSS JOIN LATERAL ( SELECT concat(r_1.key, '.', r_obj.key) AS key,
                        r_obj.value
                        FROM jsonb_each(r_1.value) r_obj(key, value)
                      WHERE jsonb_typeof(r_1.value) = 'object'::text
                    UNION
                      SELECT r_1.key,
                        r_arr.value
                        FROM jsonb_array_elements(r_1.value) r_arr(value)
                      WHERE jsonb_typeof(r_1.value) = 'array'::text) _r
            )
      SELECT r.key,
            CASE
                WHEN jsonb_typeof(r.value) = 'object'::text THEN to_json('[object]'::text)::jsonb
                WHEN jsonb_typeof(r.value) = 'array'::text THEN to_json('[array]'::text)::jsonb
                ELSE r.value
            END AS value,
        count(*) AS count
        FROM r
      GROUP BY r.key, r.value
      ORDER BY (count(*)) DESC;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop index schemas_meta_gin_index;
    `)
    await queryRunner.query(`
      drop index schemas_meta_gist_fts_index;
    `)
    await queryRunner.query(`
      drop materialized view schemas_key_value_counts;
    `)
  }
}
