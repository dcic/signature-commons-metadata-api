import { Entity, model, property } from '@loopback/repository';
import { getJsonSchema, SchemasObject, SchemaObject } from '@loopback/rest';

@model({
  name: 'Signature',
  description: 'A single signature consisting of weighted associations of entities',
  settings: {
    postgresql: {
      table: 'signatures'
    },
    allowExtendedOperators: true,
  },
})
export class Signature extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
    postgresql: {
      columnName: 'uuid',
    },
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'libid',
    },
  })
  library: string;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'json',
      tsVector: 'english',
    },
    required: true,
    default: {},
  })
  meta: JSON;

  constructor(data?: Partial<Signature>) {
    super(data);
  }
}

const schema = getJsonSchema(Signature) as SchemaObject
export const SignatureSchemas: SchemasObject = {
  Signature: {
    ...schema,
    properties: {
      ...schema.properties,
      meta: {
        $ref: '#/components/schemas/SignatureMeta'
      }
    }
  },
  SignatureMeta: {
    type: 'object',
    oneOf: [
      require('@dcic/signature-commons-schema/core/meta.json'),
      require('@dcic/signature-commons-schema/core/unknown.json'),
      require('@dcic/signature-commons-schema/meta/signature/draft-1.json'),
    ],
  },
  Meta: require('@dcic/signature-commons-schema/core/meta.json'),
  DiseasePerturbation: require('@dcic/signature-commons-schema/meta/signature/perturbation/disease.json'),
  GenePerturbation: require('@dcic/signature-commons-schema/meta/signature/perturbation/gene.json'),
  PhenotypePerturbation: require('@dcic/signature-commons-schema/meta/signature/perturbation/phenotype.json'),
  SmallMoleculePerturbation: require('@dcic/signature-commons-schema/meta/signature/perturbation/small-molecule.json'),
  OtherPerturbation: require('@dcic/signature-commons-schema/meta/signature/perturbation/other.json'),
}
