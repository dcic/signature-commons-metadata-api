import {fetch_cached} from './fetch-cached'
import * as ZSchema from 'z-schema'

/**
 * Supplemental attributes not defined in $schemas/z-schema
 */
interface ZSchemaEx extends ZSchema {
  getMissingRemoteReferences: () => string[]
  setRemoteReference: (url: string, ref: object) => void
}

/**
 * JSONLD skeleton, further validated by JSON Schema definition
 */
interface JSONLD<T extends string = string> {
  $schema: T
  [key: string]: any
}

/**
 * Confirm object is a proper JSONLD-based type
 */
function is<T extends JSONLD>(obj: any): boolean {
  if(obj.$schema === undefined) {
    return false
  } else {
    return true
  }
}

/**
 * Throw error if object is improper type, else treat it as such
 */
function assertType<T extends JSONLD>(obj: any): T {
  if(!is<T>(obj)) {
    throw new Error('$schema is not defined')
  } else {
    return obj as T
  }
}

// Instantiate validator
const _validator = new ZSchema({}) as ZSchemaEx

/**
 * validate, downloading any required references
 * 
 * @param validator ZSchema validator object
 * @param data Actual data object to be validated
 * @param schema Schema to validate object against
 */
async function validateWithDownload(validator: ZSchemaEx, data: object, schema: object): Promise<boolean> {
  while(true) {
    const lastResult = validator.validate(data, schema)
    const missingReferences = validator.getMissingRemoteReferences()
    if (missingReferences.length === 0) {
      return lastResult
    } else {
      for(const url of missingReferences) {
        validator.setRemoteReference(
          url,
          await fetch_cached(url)
        )
      }
    }
  }
}

/**
 * validate utility function
 * 
 * @param obj_ JSONLD-style object to be validated
 * @param key Key of this object to be referenced in (potential) error results
 */
export  async function *validate(obj_: object): AsyncIterable<Error> {
  try {
    // Validate we've got a JSONLD validatable type
    const obj = assertType<JSONLD>(obj_)

    // Validate single JSONLD object
    const valid = await validateWithDownload(
      _validator,
      obj,
      await fetch_cached<JSONLD>(obj.$schema)
    )

    if(!valid) {
      // Return errors
      for(const e of _validator.getLastErrors()) {
        yield(new Error(JSON.stringify(e)))
      }
    } else {
      // Recursively validate JSONLD objects (NOTE: only works with direct children)
      for(const sub_obj of Object.values(obj)) {
        if(is<JSONLD>(sub_obj)) {
          for await(const e of validate(sub_obj)) {
            yield(e)
          }
        }
      }
    }
  } catch(e) {
    yield(e)
  }
}
