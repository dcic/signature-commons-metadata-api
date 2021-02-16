import {
  Brackets,
  Connection,
  DeepPartial,
  EntityMetadata,
  ObjectType,
  SelectQueryBuilder,
} from 'typeorm';
import {JSON, JSONLiteral} from '../types/JSON';
import {
  ExColumnMetadata,
  ExColumnMetadataDeep,
  ExQueryParams,
  ExSafe,
  findDeepCol,
  findProp,
  withSafe,
} from './helpers';

export type ExFilter = {
  fields?: ExFields;
  where?: ExWhere;
  order?: ExOrder;
  skip?: number;
  limit?: number;
};

export type ExContext = {
  id?: number;
  alias: string;
  metadata: EntityMetadata;
};

export async function find<T>(
  connection: Connection,
  entity: ObjectType<T>,
  filter?: ExFilter,
  join?: ExJoin,
): Promise<T[]> {
  const {fields, where, order, skip, limit} =
    filter === undefined ? ({} as ExFilter) : filter;

  const context: ExContext = {
    alias: 'table',
    metadata: connection.getMetadata(entity),
  };

  let qs = connection.createQueryBuilder(entity, context.alias);
  if (fields !== undefined) {
    const {query, params} = buildSelect(context, fields);
    if (query) {
      qs = qs.select(query).setParameters(params);
    }
  }
  if (join !== undefined) {
    qs = buildJoin<T>(context, join)(qs);
  }
  if (where !== undefined) {
    qs = qs.where(buildWhere(context, where));
  }
  if (order !== undefined) {
    const {query, params} = buildOrder(context, order);
    if (query) {
      qs = qs.orderBy(query).setParameters(params);
    }
  }
  if (skip !== undefined) {
    qs = qs.skip(skip);
  }
  if (limit !== undefined) {
    qs = qs.limit(limit);
  }
  if (fields !== undefined) {
    return qs.getRawMany();
  } else {
    return qs.getMany();
  }
}

export type ExFields = string[];

export function buildSelect(
  context: ExContext,
  fields: ExFields,
): ExQueryParams {
  const select = [];
  const deepQueries: {
    [key: string]: ExColumnMetadataDeep[]
  } = {};
  const all_params = {};
  for (const pk of context.metadata.primaryColumns) {
    if (fields.indexOf(pk.propertyName) === -1) {
      fields.push(pk.propertyName);
    }
  }
  for (const field of fields) {
    const propMetadata = findDeepCol(context.metadata, field);
    if (propMetadata.deep) {
      if (fields.indexOf(propMetadata.metadata.propertyName) !== -1) {
        // deep selection but we're already getting the root prop
        continue;
      }
      if (deepQueries[propMetadata.metadata.propertyName] === undefined) {
        deepQueries[propMetadata.metadata.propertyName] = [];
      }
      deepQueries[propMetadata.metadata.propertyName].push(propMetadata);
    } else {
      const {query, params} = withSafe(
        context,
        safe => `${propMetadata.asExpression(safe, context.alias)}`,
      );
      Object.assign(all_params, params);
      select.push(query);
    }
  }
  for (const deepCol in deepQueries) {
    const deepQuery = [];
    for (const propMetadata of deepQueries[deepCol]) {
      const {query, params} = withSafe(context, safe =>
        propMetadata.asExpressionObject(safe, context.alias),
      );
      Object.assign(all_params, params);
      deepQuery.push(query);
    }
    select.push(`(${deepQuery.join('||')}) as ${deepCol}`);
  }
  return {query: select.join(', '), params: all_params};
}

export type ExJoin = {
  relation: string; // the relationship on the entity that is being queried
  where: ExWhere; // the where clause on the other side of the relationship (e.g. pk=something)
};

export function buildJoin<T>(context: ExContext, join: ExJoin) {
  return (qs: SelectQueryBuilder<T>) => {
    const joinAlias = `${context.alias}_relation`;
    const joinPropertyMetadata = context.metadata.findRelationWithPropertyPath(
      join.relation,
    );
    if (joinPropertyMetadata === undefined || joinPropertyMetadata.inverseRelation === undefined)
      throw new Error(
        `Cannot find relation ${join.relation} in ${context.metadata.name}`,
      );
    const joinEntityMetadata = joinPropertyMetadata.inverseEntityMetadata;
    const conditionClauses = [];
    for (let i = 0; i < joinPropertyMetadata.joinColumns.length; i++) {
      const joinColumn = joinPropertyMetadata.joinColumns[i]
      if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
      conditionClauses.push(
        `"${context.alias}"."${joinColumn.databaseName}" = "${joinAlias}"."${joinColumn.referencedColumn.databaseName}"`,
      );
    }
    for (
      let i = 0;
      i < joinPropertyMetadata.inverseRelation.joinColumns.length;
      i++
    ) {
      const joinColumn = joinPropertyMetadata.inverseRelation.joinColumns[i]
      if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
      conditionClauses.push(
        `"${joinAlias}"."${joinColumn.databaseName}" = "${context.alias}"."${joinColumn.referencedColumn.databaseName}"`,
      );
    }
    qs = qs.innerJoin(
      joinEntityMetadata.tableName,
      joinAlias,
      conditionClauses.join(' and '),
    );
    const joinContext: ExContext = {
      id: context.id,
      alias: joinAlias,
      metadata: joinEntityMetadata,
    };
    qs = qs.where(buildWhere(joinContext, join.where));
    Object.assign(context, {id: joinContext.id}); // ensure id updates are saved into the main context
    return qs;
  };
}

export type ExWhere =
  {[key: string]: ExWhereCond}
  | {and: ExWhere[]}
  | {or: ExWhere[]};

export function buildWhere(context: ExContext, where: ExWhere) {
  return new Brackets(qs => {
    if ('and' in where) {
      qs = qs.andWhere(
        new Brackets(qb => {
          for (const w of where.and as ExWhere[]) {
            qb.andWhere(buildWhere(context, w));
          }
          return qb;
        }),
      );
    } else if ('or' in where) {
      qs = qs.andWhere(
        new Brackets(qb => {
          for (const w of where.or as ExWhere[]) {
            qb = qb.orWhere(buildWhere(context, w));
          }
          return qb;
        }),
      );
    } else {
      for (const key in where) {
        const {query, params} = buildCond(context, key, where[key]);
        qs = qs.andWhere(query, params);
      }
    }
    return qs;
  });
}

export type ExWhereCond =
  JSON
  | {between: [JSONLiteral, JSONLiteral]}
  | {fullTextSearch: ExWhereCondFTS}
  | {lt: JSONLiteral}
  | {lte: JSONLiteral}
  | {gt: JSONLiteral}
  | {gte: JSONLiteral}
  | {like: JSONLiteral}
  | {ilike: JSONLiteral}
  | {nlike: JSONLiteral}
  | {nilike: JSONLiteral}
  | {inq: JSONLiteral[]}
  | {nin: JSONLiteral[]}
  | {neq: JSON}
  | {eq: JSON};

function buildCond(
  context: ExContext,
  prop: string,
  cond: ExWhereCond,
): ExQueryParams {
  const propMetadata = findDeepCol(context.metadata, prop);
  let value: JSON;
  if (typeof cond === 'object' && cond !== null) {
    if (Object.keys(cond).length === 1) {
      if ('between' in cond) {
        if (!Array.isArray(cond.between) || cond.between.length !== 2) throw new Error('Syntax error')
        const [start, end] = cond.between;
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} between ${safe(
              start,
            )} and ${safe(end)}`,
        );
      } else if ('fullTextSearch' in cond) {
        return withSafe(
          context,
          safe =>
            `to_tsvector('english', ${propMetadata.asExpression(
              safe,
              context.alias,
            )}) @@ ${buildFTS(safe, propMetadata, cond.fullTextSearch)}`,
        );
      } else if ('lt' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} < ${safe(
              cond.lt,
            )}`,
        );
      } else if ('lte' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} <= ${safe(
              cond.lte,
            )}`,
        );
      } else if ('gt' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} > ${safe(
              cond.gt,
            )}`,
        );
      } else if ('gte' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} >= ${safe(
              cond.gte,
            )}`,
        );
      } else if ('like' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} like ${safe(
              cond.like,
            )}`,
        );
      } else if ('ilike' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} ilike ${safe(
              cond.ilike,
            )}`,
        );
      } else if ('nlike' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} not like ${safe(
              cond.nlike,
            )}`,
        );
      } else if ('nilike' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} not ilike ${safe(
              cond.nilike,
            )}`,
        );
      } else if ('inq' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} in ${safe(
              cond.inq,
              true,
            )}`,
        );
      } else if ('nin' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} not in ${safe(
              cond.nin,
              true,
            )}`,
        );
      } else if ('neq' in cond) {
        return withSafe(
          context,
          safe =>
            `${propMetadata.asExpression(safe, context.alias)} != ${safe(
              cond.neq as JSON,
            )}`,
        );
      } else if ('eq' in cond) {
        value = cond.eq;
      } else {
        value = cond;
      }
    } else {
      value = cond;
    }
  } else {
    value = cond;
  }
  if (
    (propMetadata.metadata.type === 'json' ||
      propMetadata.metadata.type === 'jsonb') &&
    typeof value === 'string'
  ) {
    value = JSON.stringify(value);
  }
  return withSafe(
    context,
    safe =>
      `${propMetadata.asExpression(safe, context.alias)} = ${safe(value)}::${
        propMetadata.metadata.type
      }`,
  );
}

export type ExWhereCondFTS =
  JSON
  | {eq: string}
  | {neq: string}
  | {not: ExWhereCondFTS}
  | {and: ExWhereCondFTS[]}
  | {or: ExWhereCondFTS[]};

function buildFTS(
  safe: ExSafe,
  propMetadata: ExColumnMetadata,
  fullTextSearch: ExWhereCondFTS,
): string {
  let query = '';
  if (typeof fullTextSearch === 'object' && !Array.isArray(fullTextSearch) && fullTextSearch !== null) {
    if (Object.keys(fullTextSearch).length !== 1) throw new Error('Invalid syntax');
    if ('and' in fullTextSearch && Array.isArray(fullTextSearch.and)) {
      query = `(${(fullTextSearch.and as ExWhereCondFTS[])
        .map(fts => buildFTS(safe, propMetadata, fts))
        .join('&&')})`;
    } else if ('or' in fullTextSearch && Array.isArray(fullTextSearch.or)) {
      query = `(${(fullTextSearch.or as ExWhereCondFTS[])
        .map(fts => buildFTS(safe, propMetadata, fts))
        .join('||')})`;
    } else if ('not' in fullTextSearch) {
      query = `(!! ${buildFTS(safe, propMetadata, fullTextSearch.not)})`;
    } else if ('eq' in fullTextSearch) {
      query = `plainto_tsquery('english', ${safe(fullTextSearch.eq)}::text)`;
    } else if ('neq' in fullTextSearch) {
      query = `(!! plainto_tsquery('english', ${safe(
        fullTextSearch.neq,
      )}::text)`;
    } else {
      throw new Error('Invalid syntax');
    }
  } else if (typeof fullTextSearch === 'object') {
    throw new Error('Invalid syntax');
  } else {
    query = `plainto_tsquery('english', ${safe(fullTextSearch)}::text)`;
  }
  return query;
}

export type ExOrder = {[key: string]: 'ASC' | 'DESC'};

export function buildOrder(context: ExContext, order: ExOrder): ExQueryParams {
  return withSafe(context, safe => {
    const preparedOrder = [];
    for (const col in order) {
      const propMetadata = findDeepCol(context.metadata, col);
      preparedOrder.push(
        `${propMetadata.asExpression(safe, context.alias)} ${
          order[col].toLocaleLowerCase() === 'desc' ? 'desc' : 'asc'
        }`,
      );
    }
    if (preparedOrder.length > 0) {
      return `order by ${preparedOrder.join(',')}`;
    } else {
      return '';
    }
  });
}

export function prepareDatum<T>(
  entityMetadata: EntityMetadata,
  datum: any,
): DeepPartial<T> {
  // Convert typical format to DeepPartial format -- specifically, relationships should be
  //  { id: "uuid" } in DeepPartial format, but we usually just use "uuid"
  const newDatum: any = {};
  let legacy = false;
  for (const prop in datum) {
    const propMeta = findProp(entityMetadata, prop);
    if (propMeta.kind === 'column') {
      newDatum[prop] = datum[prop];
    } else if (propMeta.kind === 'relationship') {
      if (typeof datum[prop] === 'object') {
        if (Array.isArray(datum[prop])) {
          const fixed = [];
          for (const datum_rel of datum[prop]) {
            if (typeof datum_rel !== 'object') {
              legacy = true;
              fixed.push({id: datum_rel});
            } else {
              fixed.push(datum_rel);
            }
          }
          newDatum[prop] = fixed;
        } else {
          newDatum[prop] = datum[prop];
        }
      } else {
        legacy = true;
        newDatum[prop] = {id: datum[prop]};
      }
    }
  }
  if (legacy)
    console.warn(
      'Legacy format deprecated, please use "key": { "id": "value" } on relationships',
    );
  return newDatum;
}
