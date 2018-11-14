import * as entityTest from "@dcic/signature-commons-schema/core/entity.test.json";
import * as libraryTest from "@dcic/signature-commons-schema/core/library.test.json";
import * as signatureTest from "@dcic/signature-commons-schema/core/signature.test.json";
import { Entity, Library, Signature, UserProfile } from "../../src/models";
import { EntityRepository, LibraryRepository, SignatureRepository } from "../../src/repositories";
import { testdb } from "../fixtures/datasources/testdb.datasource";
import { UserProfileRepository } from "../../src/repositories/user-profile.repository";

export async function givenValidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      _id: 0,
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
    },
    data,
  )
}

export async function givenInvalidLibraryData(data?: Partial<Library>) {
  const d = libraryTest.tests.filter((test) => !test.valid)[0].data
  return Object.assign(
    {
      _id: 0,
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
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
  const d = signatureTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      _id: 0,
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
      _id: 0,
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
    testdb
  ).create(
    <Partial<Signature>>await givenValidSignatureData(data)
  )
}

export async function givenValidEntityData(data?: Partial<Entity>) {
  const d = entityTest.tests.filter((test) => test.valid)[0].data
  return Object.assign(
    {
      _id: 0,
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
      _id: 0,
      // $validator: d.$validator,
      id: d.id,
      meta: d.meta,
    },
    data,
  )
}

export async function givenEntity(data?: Partial<Entity>) {
  return await new EntityRepository(
    testdb
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
    testdb
  ).create(
    <Partial<UserProfile>>await givenAdminUserProfileData(data)
  )
}

export async function givenEmptyDatabase() {
  await new LibraryRepository(testdb).deleteAll();
  await new SignatureRepository(testdb).deleteAll();
  await new EntityRepository(testdb).deleteAll();
  await new UserProfileRepository(testdb).deleteAll();
}
