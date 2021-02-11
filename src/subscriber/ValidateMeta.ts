import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import {MetaC} from '../types/schemas';

type WithMeta = {
  meta?: { [key: string]: unknown };
};

@EventSubscriber()
export class ValidateMeta implements EntitySubscriberInterface<WithMeta> {
  beforeInsert(event: InsertEvent<WithMeta>) {
    if (event.entity?.meta !== undefined) {
      if (!MetaC.validate(event.entity.meta)) {
        throw new Error('Meta validation failed');
      }
    }
  }

  beforeUpdate(event: UpdateEvent<WithMeta>) {
    if (event.entity?.meta !== undefined) {
      if (!MetaC.validate(event.entity.meta)) {
        throw new Error('Meta validation failed');
      }
    }
  }
}
