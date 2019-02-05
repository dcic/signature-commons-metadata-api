import { inject } from '@loopback/core';
import { juggler, Entity, Connector, Filter } from '@loopback/repository';
import { makeTemplate } from '../util/dynamic-template'
import * as config from './postgre-sql.datasource.json';
import { AnyObject } from 'loopback-datasource-juggler';

interface PostgreSQLConnector extends Connector {
  execute(sql: string, params: any[], callback: (err: Error, result: AnyObject) => void): Promise<AnyObject>
  tableEscaped(model: string): string
}

function escapeLiteral(str: string, escape_val: string = '\'') {
  var hasBackslash = false;
  var escaped = escape_val;
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c === escape_val) {
      escaped += c + c;
    } else if (c === '\\') {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }
  escaped += escape_val;
  if (hasBackslash === true) {
    escaped = ' E' + escaped;
  }
  return escaped;
}

function buildLimit(limit?: number, offset?: number) {
  var clause = [];
  if (limit === undefined || isNaN(limit)) {
    limit = 0;
  }
  if (offset === undefined || isNaN(offset)) {
    offset = 0;
  }
  if (!limit && !offset) {
    return '';
  }
  if (limit) {
    clause.push('LIMIT ' + limit);
  }
  if (offset) {
    clause.push('OFFSET ' + offset);
  }
  return clause.join(' ');
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

  async key_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    const table_escaped = this.connector.tableEscaped(model.modelName)
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `key = ${escapeLiteral(field)}`
    ).join(' and ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const results = await (new Promise((resolve, reject) => this.connector.execute(`
        with recursive r as (
            select
              v.key::text as key,
              v.value as value
            from
              ${table_escaped},
              jsonb_each(${table_escaped}.meta::jsonb) as v
          union all
            select
              concat(r.key::text, '.', _r.key::text) as key,
              _r.value as value
            from
              r,
              jsonb_each(r.value::jsonb)
                cross join lateral
                  jsonb_array_elements(r.value::jsonb)
              as _r
        )
        select
          r.key as "key",
          count(*) as "count"
        from
          r
        ${where_meta_clause}
        group by
          r.key
        order by
          "count" desc
        ${pagination_clause}
        ;
      `, [], (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    ))

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, count }: any) => ({
      ...grouped,
      [key]: count
    }), {})
  }

  async value_counts<TE extends typeof Entity, E extends Entity>(model: TE, filter?: Filter<E>): Promise<AnyObject> {
    const table_escaped = this.connector.tableEscaped(model.modelName)
    const filter_fields = ((filter || {}).fields || []) as string[]
    const where_meta_clause = (filter_fields.length <= 0) ? '' : filter_fields.map(
      (field) => `key = ${escapeLiteral(field)}`
    ).join(' and ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const results = await (new Promise((resolve, reject) => this.connector.execute(`
        with recursive r as (
            select
              v.key::text as key,
              v.value as value
            from
              ${table_escaped},
              jsonb_each(${table_escaped}.meta::jsonb) as v
          union all
            select
              concat(r.key::text, '.', _r.key::text) as key,
              _r.value as value
            from
              r,
              jsonb_each(r.value::jsonb) as _r
            where
              jsonb_typeof(r.value) = 'object'
        )
        select
          r.key as "key",
          r.value as "value",
          count(*) as "count"
        from
          r
        ${where_meta_clause}
        group by
          r.key,
          r.value
        order by
          "count" desc
        ${pagination_clause}
        ;
      `, [], (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    ))

    return (results as AnyObject[]).reduce<AnyObject>((grouped: any, { key, value, count }: any) => ({
      ...grouped,
      [key]: {
        ...grouped[key],
        [value]: count,
      },
    }), {})
  }
}
