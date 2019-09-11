import {MigrationInterface, QueryRunner} from "typeorm";

export class jsonbDeepKeyValue1568055725225 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      create or replace function jsonb_deep_key_value (j jsonb)
        returns table (key text, value jsonb)
        as $$
          with recursive t(key, value) as (
              select
                jj.key,
                jj.value
              from
                jsonb_each(jsonb_build_object('', j)) as jj
            union all (
              select
                (
                  case jsonb_typeof(t.value)
                    when 'object' then concat(t.key, '.', tt.key)
                    else t.key
                  end
                ) as key,
                (
                  case jsonb_typeof(t.value)
                    when 'object' then tt.value
                    when 'array' then tt.value
                    else t.value
                  end
                ) as value
              from
                t inner join lateral (
                    select ttt.key, ttt.value
                    from jsonb_each(t.value) as ttt
                    where jsonb_typeof(t.value) = 'object'
                  union all
                    select '', ttt.value
                    from jsonb_array_elements(t.value) as ttt
                    where jsonb_typeof(t.value) = 'array'
                ) as tt on true
            )
          )
          select
            substring(t.key, 2) as key,
            t.value
          from t
          where jsonb_typeof(t.value) not in ('object', 'array')
        $$ LANGUAGE SQL;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      delete function jsonb_deep_key_value;
    `)
  }

}
