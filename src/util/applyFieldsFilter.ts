import {ObjectItems} from './object-items';

/**
 * A workaround function which applies the fields filter to an object
 */
export function applyFieldsFilter(obj: object, fields: any): any {
  const top_fields = new Set(
    fields.map((field: string) => field.split('.')[0]),
  );

  if (Array.isArray(obj)) {
    return obj.reduce((objs, v) => {
      if (typeof v === 'object' && v !== null) {
        objs = [...objs, applyFieldsFilter(v, fields)];
      } else if (fields.length === 0 || top_fields.has(v)) {
        objs = [...objs, v];
      }
      return objs;
    }, []);
  }

  return ObjectItems(obj).reduce<any>((filtered_obj, [key, value]) => {
    if (fields.length === 0 || top_fields.has(key)) {
      if (typeof value === 'object' && value !== null) {
        filtered_obj[key] = applyFieldsFilter(
          value,
          fields.reduce((new_fields: string[], field: string) => {
            const field_split = field.split('.');
            if (field_split.length > 1 && field_split[0] === key) {
              new_fields = [...new_fields, field_split.slice(1).join('.')];
            }
            return new_fields;
          }, []),
        );
      } else {
        filtered_obj[key] = value;
      }
    }
    return filtered_obj;
  }, {});
}
