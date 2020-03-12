import {MigrationInterface, QueryRunner} from 'typeorm';

export class fulltextIndex1571935895258 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop index if exists libraries_meta_gist_fts_index;
      create index libraries_meta_gist_fts_index
      on libraries using gist ( to_tsvector('english', meta::text) );
    `);
    await queryRunner.query(`
      drop index if exists signatures_meta_gist_fts_index;
      create index signatures_meta_gist_fts_index
      on signatures using gist ( to_tsvector('english', meta::text) );
    `);
    await queryRunner.query(`
      drop index if exists entities_meta_gist_fts_index;
      create index entities_meta_gist_fts_index
      on entities using gist ( to_tsvector('english', meta::text) );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop index libraries_meta_gist_fts_index;
    `);
    await queryRunner.query(`
      drop index signatures_meta_gist_fts_index;
    `);
    await queryRunner.query(`
      drop index entities_meta_gist_fts_index;
    `);
  }
}
