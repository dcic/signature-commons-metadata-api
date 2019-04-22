import { DefaultCrudRepository, Entity } from "@loopback/repository";
import { ModelSettings } from "loopback-datasource-juggler";

export class GenericEntity extends Entity {
  $validator?: string
  id: string
  meta: object
}

export class GenericRepository<entity extends GenericEntity> extends DefaultCrudRepository<entity, string> {
  public async validators(): Promise<string[]> {
    const table: string = (this.modelClass.definition.settings as ModelSettings).postgresql.table

    return await new Promise<string[]>(
      (resolve, reject) => {
        (this.dataSource.connector as any).query(`
        select distinct
          meta->>'$validator'
        from
          "${table}"
        ;`, (err: any, results: string[]) => {
            if (err !== null) reject(err)
            resolve(results)
          })
      }
    )
  }
}
