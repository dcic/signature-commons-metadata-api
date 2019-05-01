import * as entityTest from "@dcic/signature-commons-schema/core/entity.test.json";
import * as libraryTest from "@dcic/signature-commons-schema/core/library.test.json";
import * as signatureTest from "@dcic/signature-commons-schema/core/signature.test.json";
import { Entity, Library, Signature } from "../../src/entities";
import { UserProfile } from "../../src/models";
import { EntityRepository, LibraryRepository, SignatureRepository, UserProfileRepository } from "../../src/repositories";
import { memory_factory, typeorm_factory } from "../fixtures/datasources/testdb.datasource";

const memory_db = memory_factory()
export { memory_db }

const typeorm_db = typeorm_factory()
export { typeorm_db }

export async function givenValidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
      dataset: d.dataset,
      dataset_type: d.dataset_type,
      Signature_keys: [],
    },
    data,
  )
}

export async function givenInvalidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
      dataset: d.dataset,
      dataset_type: d.dataset_type,
      Signature_keys: [],
    },
    data,
  )
}

export async function givenLibrary(data?: Partial<Library>) {
  return await new LibraryRepository(
    typeorm_db
  ).create(
    <Partial<Library>>await givenValidLibraryData(data)
  )
}

export async function givenValidSignatureData(data?: Partial<Signature>) {
  const d = signatureTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
      library: d.library,
    },
    data,
  )
}

export async function givenInvalidSignatureData(data?: Partial<Signature>) {
  const d = signatureTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
      library: d.library,
    },
    data,
  )
}

export async function givenSignature(data?: Partial<Signature>) {
  return await new SignatureRepository(
    typeorm_db
  ).create(
    <Partial<Signature>>await givenValidSignatureData(data)
  )
}

export async function givenValidEntityData(data?: Partial<Entity>) {
  const d = entityTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      // $validator: d.$validator,
      id: d.id,
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
      id: d.id,
      meta: d.meta,
    },
    data,
  )
}

export async function givenEntity(data?: Partial<Entity>) {
  return await new EntityRepository(
    typeorm_db
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
    memory_db
  ).create(
    <Partial<UserProfile>>await givenAdminUserProfileData(data)
  )
}

export async function givenEmptyDatabase() {
  await new LibraryRepository(typeorm_db).deleteAll();
  await new SignatureRepository(typeorm_db).deleteAll();
  await new EntityRepository(typeorm_db).deleteAll();
  await new UserProfileRepository(memory_db).deleteAll();
}
