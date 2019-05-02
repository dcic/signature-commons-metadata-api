import { inject } from '@loopback/core';
import { juggler, Entity, Connector, Filter } from '@loopback/repository';
import { makeTemplate } from '../util/dynamic-template'
import * as config from './postgre-sql.datasource.json';
import { AnyObject } from 'loopback-datasource-juggler';
import debug from '../util/debug'
import { escapeLiteral, buildLimit } from '../util/sql_building';

interface PostgreSQLConnector extends Connector {
  execute(sql: string, params: any[], callback: (err: Error, result: AnyObject) => void): Promise<AnyObject>
  tableEscaped(model: string): string
}

export class PostgreSQLDataSource extends juggler.DataSource {
  static dataSourceName = 'PostgreSQL';

  connector: PostgreSQLConnector

  constructor(
    @inject('datasources.config.PostgreSQL', { optional: true })
    dsConfig: any = config,
  ) {
    // Fill in variables with environment
    super(Object.keys(dsConfig).reduce(
      (args, arg: string) => ({
        ...args,
        [arg]: (typeof dsConfig[arg] === 'string') ? makeTemplate(dsConfig[arg] as string, process.env as { [key: string]: string }) : dsConfig[arg]
      }),
      {}
    ))
  }

  async autoupdate(models: string[]): Promise<any> {
    // Update database schemas of the programatic model definitions
    await super.autoupdate(models)

    // Process some custom views for custom model crawling
    for (const model of models) {
      const model_entity = this.getModel(model)
      if (model_entity === undefined)
        throw new Error(`Model: ${model} not found`)

      const tableName = model_entity.definition.tableName('postgresql')

      await new Promise((resolve, reject) => this.connector.execute(`
        drop materialized view if exists ${tableName}_key_value_counts;
        `, [], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      )
      await new Promise(
        (reject, resolve) => {
          const query = `
          create materialized view ${tableName}_key_value_counts
          as
          with recursive r as (
              select
                v.key::text as key,
                v.value as value
              from
                ${tableName},
                jsonb_each(${tableName}.meta::jsonb) as v
            union all
              select _r.*
              from
                r cross join lateral (
                  select
                    concat(r.key::text, '.', r_obj.key::text) as key,
                    r_obj.value as value
                  from jsonb_each(r.value) as r_obj
                  where jsonb_typeof(r.value) = 'object'
                    union
                  select
                    r.key::text as key,
                    r_arr.value as value
                  from jsonb_array_elements(r.value) as r_arr
                  where jsonb_typeof(r.value) = 'array'
                ) as _r
          )
          select
            r.key as "key",
            case
              when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
              when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
              else r.value::jsonb
            end as "value",
            count(*) as "count"
          from
            r
          group by
            r.key,
            r.value
          order by
            "count" desc;
          `
          debug(query)

          this.connector.execute(query, [],
            (err, result) => {
              if (err) reject(err)
              else resolve(result)
            }
          )
        }
      )
    }

    if (models.indexOf('Library') !== -1 && models.indexOf('Signature') !== -1) {
      await new Promise((resolve, reject) => this.connector.execute(`
        drop materialized view if exists libraries_signatures_key_value_counts;
        `, [], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      )
      await new Promise(
        (resolve, reject) => {
          const query = `
          create materialized view libraries_signatures_key_value_counts
          as
          with recursive r as (
              select
                s.libid as library,
                v.key::text as key,
                v.value as value
              from
                signatures as s,
                jsonb_each(s.meta::jsonb) as v
            union all
              select _r.*
              from
                r cross join lateral (
                  select
                    r.library as library,
                    concat(r.key::text, '.', r_obj.key::text) as key,
                    r_obj.value as value
                  from jsonb_each(r.value) as r_obj
                  where jsonb_typeof(r.value) = 'object'
                    union
                  select
                    r.library as library,
                    r.key::text as key,
                    r_arr.value as value
                  from jsonb_array_elements(r.value) as r_arr
                  where jsonb_typeof(r.value) = 'array'
                ) as _r
          )
          select
            r.library as "library",
            r.key as "key",
            case
              when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
              when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
              else r.value::jsonb
            end as "value",
            count(*) as "count"
          from
            r
          group by
            r.library,
            r.key,
            r.value
          order by
            "count" desc;
          `
          debug(query)

          this.connector.execute(query, [],
            (err, result) => {
              if (err) reject(err)
              else resolve(result)
            }
          )
        }
      )
    }
  }

  async key_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, sum(r.count) as count
      from
        "${model.modelName}_key_value_counts" as r
      group by
        r.key
      ${where_meta_clause ? `
        having
          ${where_meta_clause}
      ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await (
      new Promise((resolve, reject) =>
        this.connector.execute(query, [], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      )
    )

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: count
    }), {})
  }

  async value_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `r.key = ${escapeLiteral(field)} or r.key like ${escapeLiteral(field)} || '.%'`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const query = `
      select
        r.key, r.value, r.count
      from
        "${model.modelName}_key_value_counts" as r
      ${where_meta_clause ? `
        where
          ${where_meta_clause}
      ` : ''}
      order by
        count desc
      ${pagination_clause}
      ;
    `
    debug(query)

    const results = await (
      new Promise((resolve, reject) =>
        this.connector.execute(query, [], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      )
    )

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, value, count }: any) => ({
      ...grouped,
      [key]: {
        ...grouped[key],
        [value]: count,
      },
    }), {})
  }
}
