import {
  EventSubscriber,
  EntitySubscriberInterface,
  LoadEvent,
  EntityManager,
  QueryRunner,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import {Query} from '../entities/query.model';
import {QueryResult} from '../entities/query_result.model';
import {dispatch} from '../queries';

async function ensure_query_result(event: {
  manager: EntityManager;
  queryRunner: QueryRunner;
  entity: Query;
}): Promise<void> {
  if (event.entity !== undefined) {
    if (event.entity._query_result === undefined) {
      event.entity._query_result = await event.manager.findOne(QueryResult, {
        id: event.entity.id,
      });
    }
    if (event.entity._query_result === undefined) {
      event.entity._query_result = await dispatch(
        event.queryRunner,
        event.entity,
      );
    }
  }
}

async function remove_query_result(event: {
  manager: EntityManager;
  queryRunner: QueryRunner;
  entity: Query;
}): Promise<void> {
  if (event.entity._query_result === undefined) {
    event.entity._query_result = await event.manager.findOne(QueryResult, {
      id: event.entity.id,
    });
  }
  if (event.entity._query_result !== undefined) {
    await event.manager.remove(QueryResult, event.entity._query_result);
  }
}

@EventSubscriber()
export class EnsureResults implements EntitySubscriberInterface<Query> {
  listenTo() {
    return Query;
  }

  async afterInsert(event: InsertEvent<Query>) {
    if (event.entity?.meta !== undefined) {
      await ensure_query_result(event);
    }
  }

  async beforeUpdate(event: UpdateEvent<Query>) {
    if (event.entity?.meta !== undefined) {
      await remove_query_result(event);
    }
  }

  async beforeRemove(event: RemoveEvent<Query>) {
    if (event.entity?.meta !== undefined) {
      await remove_query_result({
        manager: event.manager,
        queryRunner: event.queryRunner,
        entity: event.entity,
      });
    }
  }

  async afterLoad(entity: Query, event: LoadEvent<Query>) {
    if (event?.entity?.meta !== undefined) {
      await ensure_query_result(event);
    }
  }
}
