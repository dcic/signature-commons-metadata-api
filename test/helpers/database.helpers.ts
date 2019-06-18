import * as libraryTest from "@dcic/signature-commons-schema/core/library.test.json";
import * as signatureTest from "@dcic/signature-commons-schema/core/signature.test.json";
import * as entityTest from "@dcic/signature-commons-schema/core/entity.test.json";
import * as resourceTest from "@dcic/signature-commons-schema/core/resource.test.json";
import { Entity, Library, Signature, Resource } from "../../src/entities";
import { UserProfile } from "../../src/models";
import {
  ResourceRepository,
  LibraryRepository,
  SignatureRepository,
  EntityRepository,
  UserProfileRepository
} from "../../src/repositories";
import { memory_factory, typeorm_factory } from "../fixtures/datasources/testdb.datasource";
import * as uuidv4 from 'uuid/v4'

const memory_db = memory_factory()
export { memory_db }

const typeorm_db = typeorm_factory()
export { typeorm_db }

const resource_id_created = uuidv4()
const library_id_created = uuidv4()
const signature_id_created = uuidv4()
const entity_id_created = uuidv4()

export {
  resource_id_created,
  library_id_created,
  signature_id_created,
  entity_id_created,
}

export async function givenValidResourceData(data?: Partial<Resource>) {
  const d = resourceTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
    },
    data,
  )
}
export async function givenInvalidResourceData(data?: Partial<Resource>) {
  const d = resourceTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
    },
    data,
  )
}

export async function givenResource(data?: Partial<Resource>) {
  return await new ResourceRepository(
    await typeorm_db
  ).create(
    <Partial<Resource>>await givenValidResourceData(data)
  )
}

export async function givenValidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
      dataset: d.dataset,
      dataset_type: d.dataset_type,
      signature_keys: [],
    },
    data,
  )
}

export async function givenInvalidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
      dataset: d.dataset,
      dataset_type: d.dataset_type,
      signature_keys: [],
    },
    data,
  )
}

export async function givenLibrary(data?: Partial<Library>) {
  return await new LibraryRepository(
    await typeorm_db
  ).create(
    <Partial<Library>>await givenValidLibraryData(data)
  )
}

export async function givenValidSignatureData(data?: Partial<Signature>) {
  const d = signatureTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
      library: library_id_created,
    },
    data,
  )
}

export async function givenInvalidSignatureData(data?: Partial<Signature>) {
  const d = signatureTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
      library: library_id_created,
    },
    data,
  )
}

export async function givenSignature(data?: Partial<Signature>) {
  return await new SignatureRepository(
    await typeorm_db
  ).create(
    <Partial<Signature>>await givenValidSignatureData(data)
  )
}

export async function givenValidEntityData(data?: Partial<Entity>) {
  const d = entityTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
    },
    data,
  )
}

export async function givenInvalidEntityData(data?: Partial<Entity>) {
  const d = entityTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: uuidv4(),
      meta: d.meta,
    },
    data,
  )
}

export async function givenEntity(data?: Partial<Entity>) {
  return await new EntityRepository(
    await typeorm_db
  ).create(
    <Partial<Entity>>await givenValidEntityData(data)
  )
}

export async function givenAdminUserProfileData(data?: Partial<UserProfile>) {
  return Object.assign({
    id: 'admin',
    username: 'admin',
    password: 'admin',
    roles: '^.+$',
  },
    data,
  )
}

export async function givenAdminUserProfile(data?: Partial<UserProfile>) {
  return await new UserProfileRepository(
    await memory_db
  ).create(
    <Partial<UserProfile>>await givenAdminUserProfileData(data)
  )
}

export async function givenEmptyDatabase() {
  await new ResourceRepository(await typeorm_db).deleteAll({ id: { neq: resource_id_created } });
  await new LibraryRepository(await typeorm_db).deleteAll({ id: { neq: library_id_created } })
  await new SignatureRepository(await typeorm_db).deleteAll({ id: { neq: signature_id_created } });
  await new EntityRepository(await typeorm_db).deleteAll({ id: { neq: entity_id_created } });
  await new UserProfileRepository(await memory_db).deleteAll();
}
