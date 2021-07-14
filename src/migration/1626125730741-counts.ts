import {MigrationInterface, QueryRunner} from 'typeorm';

export class counts1626125730741 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
            create index if not exists signature_to_entity on signatures_entities (signature, direction)
        `);
    await queryRunner.query(`
            create index if not exists entity_to_signature on signatures_entities (entity, direction)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
            drop index if exists signature_to_entity;
            drop index if exists entity_to_signature;
        `);
  }
}
