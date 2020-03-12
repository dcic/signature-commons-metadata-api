import * as libraryTest from "@dcic/signature-commons-schema/core/library.test.json";
import * as signatureTest from "@dcic/signature-commons-schema/core/signature.test.json";
import * as entityTest from "@dcic/signature-commons-schema/core/entity.test.json";
import * as resourceTest from "@dcic/signature-commons-schema/core/resource.test.json";
import * as schemaTest from "@dcic/signature-commons-schema/core/schema.test.json";
import { Resource, Library, Signature, Entity, Schema } from "../../src/entities";
import { UserProfile } from "../../src/models";
import {
  ResourceRepository,
  LibraryRepository,
  SignatureRepository,
  EntityRepository,
  SchemaRepository,
  UserProfileRepository,
} from "../../src/repositories";
import { memory_factory, typeorm_factory } from "../fixtures/datasources/testdb.datasource";
import * as uuidv4 from 'uuid/v4'

const memory_db = memory_factory()
export { memory_db }

const typeorm_db = typeorm_factory()
export { typeorm_db }

export interface DatabaseTestContext {
  resources: Array<string>
  libraries: Array<string>
  signatures: Array<string>
  entities: Array<string>
  schemas: Array<string>
  users: Array<string>
}

export async function givenDatabaseTestContext(): Promise<DatabaseTestContext> {
  return {
    resources: [],
    libraries: [],
    signatures: [],
    entities: [],
    schemas: [],
    users: [],
  }
}

export async function givenValidResourceData(ctx: DatabaseTestContext, data?: Partial<Resource>) {
  const id = uuidv4()
  const { meta } = resourceTest.tests.filter((test) => test.valid)[0].data
  ctx.resources.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}
export async function givenInvalidResourceData(ctx: DatabaseTestContext, data?: Partial<Resource>) {
  const id = uuidv4()
  const { meta } = resourceTest.tests.filter((test) => !test.valid)[0].data
  ctx.resources.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}

export async function givenResource(ctx: DatabaseTestContext, data?: Partial<Resource>) {
  return await new ResourceRepository(
    await typeorm_db
  ).create(
    <Partial<Resource>>await givenValidResourceData(ctx, data)
  )
}

export async function givenValidLibraryData(ctx: DatabaseTestContext, data?: Partial<Library>) {
  const id = uuidv4()
  const { meta, dataset, dataset_type } = libraryTest.tests.filter((test) => test.valid)[0].data
  ctx.libraries.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      resource: ctx.resources[0],
      meta,
      dataset,
      dataset_type,
    },
    data,
  )
}

export async function givenInvalidLibraryData(ctx: DatabaseTestContext, data?: Partial<Library>) {
  const id = uuidv4()
  const { meta, dataset, dataset_type } = libraryTest.tests.filter((test) => !test.valid)[0].data
  ctx.libraries.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
      dataset,
      dataset_type,
    },
    data,
  )
}

export async function givenLibrary(ctx: DatabaseTestContext, data?: Partial<Library>) {
  return await new LibraryRepository(
    await typeorm_db
  ).create(
    <Partial<Library>>await givenValidLibraryData(ctx, data)
  )
}

export async function givenValidSignatureData(ctx: DatabaseTestContext, data?: Partial<Signature>) {
  const id = uuidv4()
  const { meta } = signatureTest.tests.filter((test) => test.valid)[0].data
  ctx.signatures.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
      library: ctx.libraries[0],
    },
    data,
  )
}

export async function givenInvalidSignatureData(ctx: DatabaseTestContext, data?: Partial<Signature>) {
  const id = uuidv4()
  const { meta } = signatureTest.tests.filter((test) => !test.valid)[0].data
  ctx.signatures.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
      library: ctx.libraries[0],
    },
    data,
  )
}

export async function givenSignature(ctx: DatabaseTestContext, data?: Partial<Signature>) {
  return await new SignatureRepository(
    await typeorm_db
  ).create(
    <Partial<Signature>>await givenValidSignatureData(ctx, data)
  )
}

export async function givenValidEntityData(ctx: DatabaseTestContext, data?: Partial<Entity>) {
  const id = uuidv4()
  const { meta } = entityTest.tests.filter((test) => test.valid)[0].data
  ctx.entities.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}

export async function givenInvalidEntityData(ctx: DatabaseTestContext, data?: Partial<Entity>) {
  const id = uuidv4()
  const { meta } = entityTest.tests.filter((test) => !test.valid)[0].data
  ctx.entities.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}

export async function givenEntity(ctx: DatabaseTestContext, data?: Partial<Entity>) {
  return await new EntityRepository(
    await typeorm_db
  ).create(
    <Partial<Entity>>await givenValidEntityData(ctx, data)
  )
}

export async function givenValidSchemaData(ctx: DatabaseTestContext, data?: Partial<Schema>) {
  const id = uuidv4()
  const { meta } = schemaTest.tests.filter((test) => test.valid)[0].data
  ctx.schemas.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}

export async function givenInvalidSchemaData(ctx: DatabaseTestContext, data?: Partial<Schema>) {
  const id = uuidv4()
  const { meta } = schemaTest.tests.filter((test) => !test.valid)[0].data
  ctx.schemas.push(id)
  return Object.assign(
    {
      // $validator: d.$validator,
      id,
      meta,
    },
    data,
  )
}

export async function givenSchema(ctx: DatabaseTestContext, data?: Partial<Schema>) {
  return await new SchemaRepository(
    await typeorm_db
  ).create(
    <Partial<Schema>>await givenValidSchemaData(ctx, data)
  )
}

export async function givenAdminUserProfileData(ctx: DatabaseTestContext, data?: Partial<UserProfile>) {
  const id = uuidv4()
  ctx.users.push(id)
  return Object.assign({
    id,
    username: 'admin',
    password: 'admin',
    roles: '^.+$',
  },
    data,
  )
}

export async function givenAdminUserProfile(ctx: DatabaseTestContext, data?: Partial<UserProfile>) {
  return await new UserProfileRepository(
    await memory_db
  ).create(
    <Partial<UserProfile>>await givenAdminUserProfileData(ctx, data)
  )
}

export async function givenEmptyDatabase(ctx: DatabaseTestContext) {
  await new EntityRepository(await typeorm_db).deleteAll({ id: { inq: ctx.entities } });
  await new SignatureRepository(await typeorm_db).deleteAll({ id: { inq: ctx.signatures } });
  await new LibraryRepository(await typeorm_db).deleteAll({ id: { inq: ctx.libraries } });
  await new ResourceRepository(await typeorm_db).deleteAll({ id: { inq: ctx.resources } });
  await new SchemaRepository(await typeorm_db).deleteAll({ id: { inq: ctx.schemas } });
  await new UserProfileRepository(await memory_db).deleteAll({ id: { inq: ctx.users } });
  Object.assign(ctx, await givenDatabaseTestContext())
  await givenResource(ctx);
  await givenLibrary(ctx);
  await givenSignature(ctx);
  await givenEntity(ctx);
  await givenSchema(ctx);
}
