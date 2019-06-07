import { MigrationInterface, QueryRunner } from "typeorm";

export class metaGinIndex1559853038280 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      create index libraries_meta_gin_index
      on libraries using gin ( meta );
    `)
    await queryRunner.query(`
      create index signatures_meta_gin_index
      on signatures using gin ( meta );
    `)
    await queryRunner.query(`
      create index entities_meta_gin_index
      on entities using gin ( meta );
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      drop index libraries_meta_gin_index;
    `)
    await queryRunner.query(`
      drop index signatures_meta_gin_index;
    `)
    await queryRunner.query(`
      drop index entities_meta_gin_index;
    `)
  }
}
