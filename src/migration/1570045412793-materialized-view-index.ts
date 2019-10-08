import {MigrationInterface, QueryRunner} from "typeorm";

export class materializedViewIndex1570045412793 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            create unique index libraries_key_value_counts_unique on libraries_key_value_counts (
                key, value
            );
        `)
        await queryRunner.query(`
            create unique index signatures_key_value_counts_unique on signatures_key_value_counts (
                key, value
            );
        `)
        await queryRunner.query(`
            create unique index entities_key_value_counts_unique on entities_key_value_counts (
                key, value
            );
        `)
        await queryRunner.query(`
            create unique index libraries_signatures_key_value_counts_unique on libraries_signatures_key_value_counts (
                library, key, value
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            drop unique index libraries_key_value_counts_unique;
        `)
        await queryRunner.query(`
            drop unique index signatures_key_value_counts_unique;
        `)
        await queryRunner.query(`
            drop unique index entities_key_value_counts_unique;
        `)
        await queryRunner.query(`
            drop unique index libraries_signatures_key_value_counts_unique;
        `)
    }

}
