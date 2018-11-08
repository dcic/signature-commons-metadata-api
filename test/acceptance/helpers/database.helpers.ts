import { Entity, Library, Signature } from "../../../src/models";
import { LibraryRepository, SignatureRepository, EntityRepository } from "../../../src/repositories";
import { testdb } from "../fixtures/datasources/testdb.datasource";

export async function givenValidLibraryData(data?: Partial<Library>) {
  return Object.assign(
    {
      id: 0,
      uuid: 'ee4ff944-17de-4715-889e-c51f7d5e8cde',
      meta: <any>{
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        },
        test: 'test'
      }
    },
    data,
  )
}

export async function givenInvalidLibraryData(data?: Partial<Library>) {
  return Object.assign(
    {
      id: 0,
      uuid: 'ee4ff944-17de-4715-889e-c51f7d5e8cde',
      meta: <any>{
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        }
      }
    },
    data,
  )
}

export async function givenLibrary(data?: Partial<Library>) {
  return await new LibraryRepository(
    testdb
  ).create(
    <Partial<Library>>await givenValidLibraryData(data)
  )
}

export async function givenValidSignatureData(data?: Partial<Signature>) {
  return Object.assign(
    {
      id: 1,
      uuid: 'd6cdda1b-fd03-45b3-af91-a2de6ad26614',
      meta: {
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        },
        test: 'test'
      }
    },
    data,
  )
}

export async function givenInvalidSignatureData(data?: Partial<Signature>) {
  return Object.assign(
    {
      id: 1,
      uuid: 'd6cdda1b-fd03-45b3-af91-a2de6ad26614',
      meta: {
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        }
      }
    },
    data,
  )
}

export async function givenSignature(data?: Partial<Signature>) {
  return await new SignatureRepository(
    testdb
  ).create(
    <Partial<Signature>>await givenValidSignatureData(data)
  )
}

export async function givenValidEntityData(data?: Partial<Entity>) {
  return Object.assign(
    {
      id: 2,
      // uuid: '8d098857-7167-4f1d-a8f9-7389bf578e67',
      meta: {
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        },
        test: 'test'
      }
    },
    data
  )
}

export async function givenInvalidEntityData(data?: Partial<Entity>) {
  return Object.assign(
    {
      id: 2,
      // uuid: '8d098857-7167-4f1d-a8f9-7389bf578e67',
      meta: {
        $validator: {
          properties: {
            test: {
              type: 'string'
            }
          },
          required: ['test']
        }
      }
    },
    data
  )
}

export async function givenEntity(data?: Partial<Entity>) {
  return await new EntityRepository(
    testdb
  ).create(
    <Partial<Entity>>await givenValidEntityData(data)
  )
}

export async function givenEmptyDatabase() {
  await new LibraryRepository(testdb).deleteAll();
  await new SignatureRepository(testdb).deleteAll();
  await new EntityRepository(testdb).deleteAll();
}
