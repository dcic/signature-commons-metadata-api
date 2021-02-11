import {MigrationInterface, QueryRunner} from 'typeorm';

const tables = ['resources', 'libraries', 'signatures', 'entities', 'schemas'];

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
    }
  }
}
