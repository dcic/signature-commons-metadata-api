import {Connection} from 'typeorm';

export async function synchronizeEx(connection: Connection) {
  for (const entityMetadata of connection.entityMetadatas) {
    for (const index of entityMetadata.indices) {
      if (index.synchronize === false) {
        const m = /^(\w+)_(\w+)_(.+)(_index)?$/.exec(index.name);
        if (m !== null) {
          const [index_name, entity_name, column_name, index_kind] = m;
          if (index_kind === 'gin') {
            connection.query(`
              create index if not exists "${index_name}"
              on ${entityMetadata.tableName}
              using gin (${column_name} jsonb_ops)
            `);
          } else if (index_kind === 'fts') {
            connection.query(`
              create index if not exists "${index_name}"
              on ${entityMetadata.tableName}
              using gin (
                to_tsvector('english', ${column_name})
              )
            `);
          } else if (index_kind === 'gist_fts') {
            connection.query(`
              create index if not exists "${index_name}"
              on ${entityMetadata.tableName}
              using gist (
                to_tsvector('english', ${column_name})
              )
            `);
          } else {
            console.warn(`Unrecognized index_kind in ${index.name}, ignored`);
          }
        }
      }
    }
  }
}
