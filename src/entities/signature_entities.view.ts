import {ViewEntity, ViewColumn, Connection, PrimaryColumn} from 'typeorm';
import {SignatureEntity} from './signature_entitites.model';
import {Entity} from './entity.model';
import {Entity as LBEntity, model} from '@loopback/repository';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('entity.uuid', 'id')
      .addSelect('entity.meta', 'meta')
      .addSelect('signature_entity.signature', 'signature')
      .addSelect('signature_entity.direction', 'direction')
      .from(Entity, 'entity')
      .innerJoin(
        SignatureEntity,
        'signature_entity',
        'signature_entity.entity = entity.uuid',
      ),
})
@model({
  name: 'Signature Entities',
  description: 'A view for getting the entities of a signature',
  settings: {
    strict: false,
  },
})
export class SignatureEntities extends LBEntity {
  @ViewColumn()
  @PrimaryColumn()
  id: string;

  @ViewColumn()
  meta: {
    [key: string]: any;
  };

  @ViewColumn()
  signature: string;

  @ViewColumn()
  direction: string;
}
