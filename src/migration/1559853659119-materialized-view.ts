import {MigrationInterface, QueryRunner} from 'typeorm';

export class materializedView1559853659119 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW libraries_key_value_counts
      AS
      WITH RECURSIVE r AS (
              SELECT v.key,
                v.value
                FROM libraries,
                LATERAL jsonb_each(libraries.meta) v(key, value)
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
    `);
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW signatures_key_value_counts
      AS
      WITH RECURSIVE r AS (
              SELECT v.key,
                v.value
                FROM signatures,
                LATERAL jsonb_each(signatures.meta) v(key, value)
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
    `);
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW entities_key_value_counts
      AS
      WITH RECURSIVE r AS (
              SELECT v.key,
                v.value
                FROM entities,
                LATERAL jsonb_each(entities.meta) v(key, value)
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
    `);
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW libraries_signatures_key_value_counts
      AS
      WITH RECURSIVE r AS (
              SELECT s.libid AS library,
                v.key,
                v.value
                FROM signatures s,
                LATERAL jsonb_each(s.meta) v(key, value)
            UNION ALL
              SELECT _r.library,
                _r.key,
                _r.value
                FROM r r_1
                  CROSS JOIN LATERAL ( SELECT r_1.library,
                        concat(r_1.key, '.', r_obj.key) AS key,
                        r_obj.value
                        FROM jsonb_each(r_1.value) r_obj(key, value)
                      WHERE jsonb_typeof(r_1.value) = 'object'::text
                    UNION
                      SELECT r_1.library,
                        r_1.key,
                        r_arr.value
                        FROM jsonb_array_elements(r_1.value) r_arr(value)
                      WHERE jsonb_typeof(r_1.value) = 'array'::text) _r
            )
      SELECT r.library,
        r.key,
            CASE
                WHEN jsonb_typeof(r.value) = 'object'::text THEN to_json('[object]'::text)::jsonb
                WHEN jsonb_typeof(r.value) = 'array'::text THEN to_json('[array]'::text)::jsonb
                ELSE r.value
            END AS value,
        count(*) AS count
        FROM r
      GROUP BY r.library, r.key, r.value
      ORDER BY (count(*)) DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop materialized view libraries_key_value_counts;
    `);
    await queryRunner.query(`
      drop materialized view signatures_key_value_counts;
    `);
    await queryRunner.query(`
      drop materialized view entities_key_value_counts;
    `);
    await queryRunner.query(`
      drop materialized view libraries_signatures_key_value_counts;
    `);
  }
}
