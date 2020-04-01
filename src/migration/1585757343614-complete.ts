import {MigrationInterface, QueryRunner} from 'typeorm';

const tables = ['resources', 'libraries', 'signatures', 'entities', 'schemas'];
const relationships = [
  {
    parent_singular: 'library',
    parent: 'libraries',
    parent_on: 'uuid',
    child: 'signatures',
    child_on: 'libid',
  },
];

export class complete1585757343614 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    for (const tbl of tables) {
      // generalized key/value search on meta
      await queryRunner.query(`
        drop index if exists ${tbl}_meta_gin_index;
        create index ${tbl}_meta_gin_index
        on ${tbl} using gin ( meta );
      `);
      // full text search on meta
      await queryRunner.query(`
        drop index if exists ${tbl}_meta_gist_fts_index;
        create index ${tbl}_meta_gist_fts_index
        on ${tbl} using gist ( to_tsvector('english', meta::text) );
      `);
      // materialized key value counts
      await queryRunner.query(`
        drop materialized view if exists ${tbl}_key_value_counts;
        create materialized view ${tbl}_key_value_counts
        as
        select
          key,
          value,
          count(*) as count
        from
          ${tbl}
        inner join lateral
          jsonb_deep_key_value(row_to_json(${tbl})::jsonb) on true
        group by key, value
        order by count desc;
      `);
    }

    for (const {
      parent_singular,
      parent,
      parent_on,
      child,
      child_on,
    } of relationships) {
      // materialized key value counts for parent-child relationship
      await queryRunner.query(`
        drop materialized view if exists ${parent}_${child}_key_value_counts;
        create materialized view ${parent}_${child}_key_value_counts
        as
        select
          ${parent}.${parent_on} as ${parent_singular},
          key,
          value,
          count(*) as count
        from
          ${parent}
          inner join
            ${child} on ${child}.${child_on} = ${parent}.${parent_on}
          inner join lateral
            jsonb_deep_key_value(row_to_json(${child})::jsonb) on true
        group by ${parent}.${parent_on}, key, value
        order by count desc;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    for (const tbl of [
      'resources',
      'libraries',
      'signatures',
      'entities',
      'schemas',
    ]) {
      await queryRunner.query(`
        drop index if exists ${tbl}_meta_gin_index;
      `);
      await queryRunner.query(`
        drop index if exists ${tbl}_meta_gist_fts_index;
      `);
      await queryRunner.query(`
        drop materialized view if exists ${tbl}_key_value_counts;
      `);
    }
    for (const {parent, child} of relationships) {
      await queryRunner.query(`
        drop materialized view if exists ${parent}_${child}_key_value_counts;
      `);
    }
  }
}
