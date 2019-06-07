import { MigrationInterface, QueryRunner } from "typeorm";

export class materializedView1559853659119 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      create materialized view libraries_key_value_counts
      as
      with recursive r as (
          select
            v.key::text as key,
            v.value as value
          from
            libraries,
            jsonb_each(libraries.meta::jsonb) as v
        union all
          select _r.*
          from
            r cross join lateral (
              select
                concat(r.key::text, '.', r_obj.key::text) as key,
                r_obj.value as value
              from jsonb_each(r.value) as r_obj
              where jsonb_typeof(r.value) = 'object'
                union
              select
                r.key::text as key,
                r_arr.value as value
              from jsonb_array_elements(r.value) as r_arr
              where jsonb_typeof(r.value) = 'array'
            ) as _r
          where jsonb_typeof(_r.value) not in ('object', 'array')
      )
      select
        r.key as "key",
        r.value as "value",
        count(*) as "count"
      from
        r
      group by
        r.key,
        r.value
      order by
        "count" desc;
    `)
    await queryRunner.query(`
      create materialized view signatures_key_value_counts
      as
      with recursive r as (
          select
            v.key::text as key,
            v.value as value
          from
            signatures,
            jsonb_each(signatures.meta::jsonb) as v
        union all
          select _r.*
          from
            r cross join lateral (
              select
                concat(r.key::text, '.', r_obj.key::text) as key,
                r_obj.value as value
              from jsonb_each(r.value) as r_obj
              where jsonb_typeof(r.value) = 'object'
                union
              select
                r.key::text as key,
                r_arr.value as value
              from jsonb_array_elements(r.value) as r_arr
              where jsonb_typeof(r.value) = 'array'
            ) as _r
          where jsonb_typeof(_r.value) not in ('object', 'array')
      )
      select
        r.key as "key",
        r.value as "value",
        count(*) as "count"
      from
        r
      group by
        r.key,
        r.value
      order by
        "count" desc;
    `)
    await queryRunner.query(`
      create materialized view entity_key_value_counts
      as
      with recursive r as (
          select
            v.key::text as key,
            v.value as value
          from
            entities,
            jsonb_each(entities.meta::jsonb) as v
        union all
          select _r.*
          from
            r cross join lateral (
              select
                concat(r.key::text, '.', r_obj.key::text) as key,
                r_obj.value as value
              from jsonb_each(r.value) as r_obj
              where jsonb_typeof(r.value) = 'object'
                union
              select
                r.key::text as key,
                r_arr.value as value
              from jsonb_array_elements(r.value) as r_arr
              where jsonb_typeof(r.value) = 'array'
            ) as _r
          where jsonb_typeof(_r.value) not in ('object', 'array')
      )
      select
        r.key as "key",
        r.value as "value",
        count(*) as "count"
      from
        r
      group by
        r.key,
        r.value
      order by
        "count" desc;
    `)
    await queryRunner.query(`
      create materialized view library_signature_key_value_counts
      as
      with recursive r as (
          select
            s.libid as library,
            v.key::text as key,
            v.value as value
          from
            signatures as s,
            jsonb_each(s.meta::jsonb) as v
        union all
          select _r.*
          from
            r cross join lateral (
              select
                r.library as library,
                concat(r.key::text, '.', r_obj.key::text) as key,
                r_obj.value as value
              from jsonb_each(r.value) as r_obj
              where jsonb_typeof(r.value) = 'object'
                union
              select
                r.library as library,
                r.key::text as key,
                r_arr.value as value
              from jsonb_array_elements(r.value) as r_arr
              where jsonb_typeof(r.value) = 'array'
            ) as _r
          where jsonb_typeof(_r.value) not in ('object', 'array')
      )
      select
        r.library as "library",
        r.key as "key",
        r.value as "value",
        count(*) as "count"
      from
        r
      group by
        r.library,
        r.key,
        r.value
      order by
        "count" desc;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop materialized view library_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view signature_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view entity_key_value_counts;
    `)
    await queryRunner.query(`
      drop materialized view library_signature_key_value_counts;
    `)
  }
}
