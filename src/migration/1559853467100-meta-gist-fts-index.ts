import { MigrationInterface, QueryRunner } from "typeorm";

export class metaGistFtsIndex1559853467100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      create index libraries_meta_gist_fts_index
      on libraries using gist ( to_tsvector('english', meta) );
    `)
    await queryRunner.query(`
      create index signatures_meta_gist_fts_index
      on signatures using gist ( to_tsvector('english', meta) );
    `)
    await queryRunner.query(`
      create index entities_meta_gist_fts_index
      on entities using gist ( to_tsvector('english', meta) );
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop index libraries_meta_gist_fts_index;
    `)
    await queryRunner.query(`
      drop index signatures_meta_gist_fts_index;
    `)
    await queryRunner.query(`
      drop index entities_meta_gist_fts_index;
    `)
  }
}
