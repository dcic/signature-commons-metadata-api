import {ViewEntity, ViewColumn, Connection, PrimaryColumn} from 'typeorm';
import {SignatureEntity} from './signature_entitites.model';
import {Signature} from './signature.model';
import {Entity as LBEntity, model} from '@loopback/repository';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('signature.uuid', 'id')
      .addSelect('signature.library', 'library')
      .addSelect('signature.meta', 'meta')
      .addSelect('signature_entity.entity', 'entity')
      .addSelect('signature_entity.direction', 'direction')
      .from(Signature, 'signature')
      .innerJoin(
        SignatureEntity,
        'signature_entity',
        'signature_entity.signature = signature.uuid',
      ),
})
@model({
  name: 'Entity Signatures',
  description: 'A view for getting the signature of an entity',
  settings: {
    strict: false,
  },
})
export class EntitySignatures extends LBEntity {
  @ViewColumn()
  @PrimaryColumn()
  id: string;

  @ViewColumn()
  library: string;

  @ViewColumn()
  meta: {
    [key: string]: any;
  };

  @ViewColumn()
  entity: string;

  @ViewColumn()
  direction: string;
}
