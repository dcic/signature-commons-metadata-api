import {MigrationInterface, QueryRunner} from 'typeorm';

export class ManyToMany1610659425200 implements MigrationInterface {
  name = 'ManyToMany1610659425200';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT IF EXISTS "fk_signature"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT IF EXISTS "fk_entity"`,
      undefined,
    );

    await queryRunner.query(
      `ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "UQ_632484ab9dff41bba94f9b7c85e"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "libraries" DROP CONSTRAINT IF EXISTS "UQ_505fedfcad00a09b3734b4223de"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures" DROP CONSTRAINT IF EXISTS "UQ_f56eb3cd344ce7f9ae28ce814eb"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "entities" DROP CONSTRAINT IF EXISTS "UQ_8640855ae82083455cbb806173d"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "schemas" DROP CONSTRAINT IF EXISTS "UQ_15ef0261cc6714f7bacfed7acfb"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" ADD CONSTRAINT "UQ_632484ab9dff41bba94f9b7c85e" UNIQUE ("id")`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "libraries" ADD CONSTRAINT "UQ_505fedfcad00a09b3734b4223de" UNIQUE ("id")`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures" ADD CONSTRAINT "UQ_f56eb3cd344ce7f9ae28ce814eb" UNIQUE ("id")`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "entities" ADD CONSTRAINT "UQ_8640855ae82083455cbb806173d" UNIQUE ("id")`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "schemas" ADD CONSTRAINT "UQ_15ef0261cc6714f7bacfed7acfb" UNIQUE ("id")`,
      undefined,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_72f2346034a28ab699c6bd5d7c"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_418dd25fac2c791f3d34b5b3c4"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72f2346034a28ab699c6bd5d7c" ON "signatures_entities" ("signature") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_418dd25fac2c791f3d34b5b3c4" ON "signatures_entities" ("entity") `,
      undefined,
    );

    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT IF EXISTS "FK_72f2346034a28ab699c6bd5d7cc"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT IF EXISTS "FK_418dd25fac2c791f3d34b5b3c4c"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" ADD CONSTRAINT "FK_72f2346034a28ab699c6bd5d7cc" FOREIGN KEY ("signature") REFERENCES "signatures"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" ADD CONSTRAINT "FK_418dd25fac2c791f3d34b5b3c4c" FOREIGN KEY ("entity") REFERENCES "entities"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT "FK_418dd25fac2c791f3d34b5b3c4c"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" DROP CONSTRAINT "FK_72f2346034a28ab699c6bd5d7cc"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_418dd25fac2c791f3d34b5b3c4"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_72f2346034a28ab699c6bd5d7c"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "schemas" DROP CONSTRAINT "UQ_15ef0261cc6714f7bacfed7acfb"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "entities" DROP CONSTRAINT "UQ_8640855ae82083455cbb806173d"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures" DROP CONSTRAINT "UQ_f56eb3cd344ce7f9ae28ce814eb"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "libraries" DROP CONSTRAINT "UQ_505fedfcad00a09b3734b4223de"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "resources" DROP CONSTRAINT "UQ_632484ab9dff41bba94f9b7c85e"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" ADD CONSTRAINT "fk_entity" FOREIGN KEY ("entity") REFERENCES "entities"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "signatures_entities" ADD CONSTRAINT "fk_signature" FOREIGN KEY ("signature") REFERENCES "signatures"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }
}
