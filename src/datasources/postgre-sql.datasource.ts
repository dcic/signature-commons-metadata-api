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
      (field) => `r.key = ${escapeLiteral(field)}`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const results = await (new Promise((resolve, reject) => this.connector.execute(`
      select
        r.key, sum(r.count) as count
      from
        "${table_escaped.slice(1, -1)}_key_value_counts" as r
      group by
        r.key
      having
        ${where_meta_clause}
      order by
        count desc
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
      (field) => `r.key = ${escapeLiteral(field)}`
    ).join(' or ')
    const pagination_clause = buildLimit((filter || {}).limit, (filter || {}).offset || (filter || {}).skip)

    const results = await (new Promise((resolve, reject) => this.connector.execute(`
      select
        r.key, r.value, r.count
      from
        "${table_escaped.slice(1, -1)}_key_value_counts" as r
      where
        ${where_meta_clause}
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
