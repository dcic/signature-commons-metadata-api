import {MigrationInterface, QueryRunner} from "typeorm";

export class materializedViewWithLists1569597110370 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop materialized view if exists libraries_key_value_counts;
    `)
    await queryRunner.query(`
      create materialized view libraries_key_value_counts
      as
      select
        key,
        value,
        count(*) as count
      from
        libraries
      inner join lateral
        jsonb_deep_key_value(row_to_json(libraries)::jsonb) on true
      group by key, value
      order by count desc;
    `)

    await queryRunner.query(`
      drop materialized view if exists signatures_key_value_counts;
    `)
    await queryRunner.query(`
      create materialized view signatures_key_value_counts
      as
      select
        key,
        value,
        count(*) as count
      from
        signatures
      inner join lateral
        jsonb_deep_key_value(row_to_json(signatures)::jsonb) on true
      group by key, value
      order by count desc;
    `)

    await queryRunner.query(`
      drop materialized view if exists entities_key_value_counts;
    `)
    await queryRunner.query(`
      create materialized view entities_key_value_counts
      as
      select
        key,
        value,
        count(*) as count
      from
        entities
      inner join lateral
        jsonb_deep_key_value(row_to_json(entities)::jsonb) on true
      group by key, value
      order by count desc;
    `)

    await queryRunner.query(`
      drop materialized view if exists libraries_signatures_key_value_counts;
    `)
    await queryRunner.query(`
      create materialized view libraries_signatures_key_value_counts
      as
      select
        libraries.uuid as library,
        key,
        value,
        count(*) as count
      from
        libraries
        inner join
          signatures on signatures.libid = libraries.uuid
        inner join lateral
          jsonb_deep_key_value(row_to_json(signatures)::jsonb) on true
      group by libraries.uuid, key, value
      order by count desc;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop materialized view libraries_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view signatures_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view entities_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view libraries_signatures_key_value_counts;
    `)
  }

}
