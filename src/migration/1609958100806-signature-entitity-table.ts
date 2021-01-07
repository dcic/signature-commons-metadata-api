import {MigrationInterface, QueryRunner} from 'typeorm';

export class signatureEntitityTable1609958100806 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS signatures_entities (
                signature UUID,
                entity UUID,
                PRIMARY KEY(signature, entity),
                CONSTRAINT fk_signature
                    FOREIGN KEY(signature) 
                        REFERENCES signatures(uuid),
                CONSTRAINT fk_entity
                    FOREIGN KEY(entity) 
                        REFERENCES entities(uuid)
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
            DROP TABLE IF EXISTS signatures_entities;
        `);
  }
}
