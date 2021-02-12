import {EntityMetadata} from 'typeorm';
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata';
import {RelationMetadata} from 'typeorm/metadata/RelationMetadata';
import {JSON, JSONObject} from '../types/JSON';

export type ExSafe = (param: JSON, list?: boolean) => string;

export type ExQueryParams = {
  query: string;
  params: JSONObject;
};

export function withSafe(
  context: {id?: number},
  cb: (safe: ExSafe) => string,
): ExQueryParams {
  const params: JSONObject = {};
  const safe = (param: JSON, list = false) => {
    if (context.id === undefined) context.id = 0
    params[context.id] = param;
    if (list) {
      return `(:...${context.id++})`;
    } else {
      return `:${context.id++}`;
    }
  };
  const query = cb(safe);
  return {query, params};
}

export type ExPropertyMetadata =
  | ({kind: 'column'} & ExColumnMetadata)
  | ({kind: 'relationship'} & ExRelationMetadata);

export function findProp(
  entityMetadata: EntityMetadata,
  selector: string,
): ExPropertyMetadata {
  try {
    return {
      kind: 'relationship',
      ...findJoin(entityMetadata, selector),
    };
  } catch {
    try {
      return {
        kind: 'column',
        ...findDeepCol(entityMetadata, selector),
      };
    } catch {
      throw new Error(`Could not find prop ${selector}`);
    }
  }
}

export type ExColumnMetadata = ExColumnMetadataShallow | ExColumnMetadataDeep;

export type ExColumnMetadataShallow = {
  asExpression: (safe: (value: JSON) => string, alias: string) => string;
  metadata: ColumnMetadata;
  deep: false;
}

export type ExColumnMetadataDeep = {
  asExpression: (safe: (value: JSON) => string, alias: string) => string;
  asExpressionObject: (safe: (value: JSON) => string, alias: string) => string;
  metadata: ColumnMetadata;
  deep: true;
};

export function findDeepCol<T>(
  entityMetadata: EntityMetadata,
  selector: string,
): ExColumnMetadata {
  const [primary_col, ...jsonb_deep_col] = selector.split('.');
  const metadata = entityMetadata.findColumnWithPropertyName(primary_col);
  if (metadata === undefined)
    throw new Error(`Could not find property ${primary_col}`);
  const deep = jsonb_deep_col.length > 0;
  if (deep) {
    const asExpression = (safe: ExSafe, alias: string) =>
      `"${alias}"."${metadata.databaseName}"->${jsonb_deep_col
        .map(v => safe(v))
        .join('->')}`;
    const asExpressionObject = (safe: ExSafe, alias: string) => {
      let i = jsonb_deep_col.length - 1;
      let expr = asExpression(safe, alias);
      while (i >= 0) {
        expr = `jsonb_build_object(${safe(
          jsonb_deep_col[i--],
        )}::text, ${expr})`;
      }
      return expr;
    };
    return { asExpression, asExpressionObject, metadata, deep };
  } else {
    const asExpression = (safe: ExSafe, alias: string) => `"${alias}"."${metadata.databaseName}"`;
    return {asExpression, metadata, deep};
  }
}

export type ExRelationMetadata = {
  metadata: RelationMetadata;
  asExpression: (
    leftAlias: string,
    rightAlias: string,
    joinKind?: string,
  ) => string;
};

export function findJoin<T>(
  entityMetadata: EntityMetadata,
  relation: string,
): ExRelationMetadata {
  const metadata = entityMetadata.findRelationWithPropertyPath(relation);
  if (metadata === undefined)
    throw new Error(`Could not find relation ${relation}`);
  let asExpression: (leftAlias: string, rightAlias: string, joinKind?: string) => string;
  if (metadata.isOneToOne || metadata.isOneToMany || metadata.isManyToOne) {
    if (metadata.isOwning) {
      asExpression = (leftAlias, rightAlias, joinKind = 'inner join') =>
        `${joinKind} "${
          metadata.inverseEntityMetadata.tableName
        }" "${rightAlias}" on ${metadata.joinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error("Unhandled");
              return `"${leftAlias}"."${joinColumn.databaseName}" = "${rightAlias}"."${joinColumn.referencedColumn.databaseName}"`
            }
          )
          .join(' and ')}`;
    } else {
      asExpression = (leftAlias, rightAlias, joinKind = 'inner join') => {
        if (metadata.inverseRelation === undefined) throw new Error('Unhandled')
        return `${joinKind} "${
          metadata.inverseEntityMetadata.tableName
        }" "${rightAlias}" on ${metadata.inverseRelation.joinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
              return `"${leftAlias}"."${joinColumn.referencedColumn.databaseName}" = "${rightAlias}"."${joinColumn.databaseName}"`
            }
          )
          .join(' and ')}`
      };
    }
  } else if (metadata.isManyToMany) {
    if (metadata.isOwning) {
      asExpression = (leftAlias, rightAlias, joinKind = 'inner join') => {
        const junctionAlias = `${leftAlias}__${rightAlias}`;
        if (metadata.junctionEntityMetadata === undefined) throw new Error('Unhandled')
        return `
          ${joinKind} "${
          metadata.junctionEntityMetadata.tableName
        }" "${junctionAlias}" on ${metadata.joinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
              return `"${junctionAlias}"."${joinColumn.databaseName}" = "${leftAlias}"."${joinColumn.referencedColumn.databaseName}"`
            }
          )
          .join(' and ')}
          ${joinKind} "${
          metadata.inverseEntityMetadata.tableName
        }" "${rightAlias}" on ${metadata.inverseJoinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
              return `"${rightAlias}"."${joinColumn.referencedColumn.databaseName}" = "${junctionAlias}"."${joinColumn.databaseName}"`
            }
          )
          .join(' and ')}`;
      };
    } else {
      asExpression = (leftAlias, rightAlias, joinKind = 'inner join') => {
        const junctionAlias = `${leftAlias}__${rightAlias}`;
        if (metadata.inverseRelation === undefined || metadata.inverseRelation.junctionEntityMetadata === undefined) throw new Error('Unhandled')
        return `
          ${joinKind} "${
          metadata.inverseRelation.junctionEntityMetadata.tableName
        }" "${junctionAlias}" on ${metadata.inverseRelation.inverseJoinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
              return `"${junctionAlias}"."${joinColumn.databaseName}" = "${leftAlias}"."${joinColumn.referencedColumn.databaseName}"`
            }
          )
          .join(' and ')}
          ${joinKind} "${
          metadata.inverseEntityMetadata.tableName
        }" "${rightAlias}" on ${metadata.inverseRelation.joinColumns
          .map(
            joinColumn => {
              if (joinColumn.referencedColumn === undefined) throw new Error('Unhandled')
              return `"${leftAlias}"."${joinColumn.referencedColumn.databaseName}" = "${junctionAlias}"."${joinColumn.databaseName}"`
            }
          )
          .join(' and ')}`;
      };
    }
  } else {
    throw new Error(`Unhandled relationship type`);
  }
  return {metadata, asExpression};
}
