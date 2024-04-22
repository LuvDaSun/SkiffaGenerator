import { PartialDeep } from "type-fest";

/**
 * deeply normalizes objects while mutating the given target
 * it removes undefined fields
 * it removes nulls
 * it removes empty arrays
 * it removes empty objects
 *
 * @param target the object to normalize
 * @returns normalized object
 */
export function normalizeObject<T>(target: T): PartialDeep<T> {
  if (typeof target === "object" && target !== null) {
    for (const name in target) {
      const value = target[name];
      if (value == null || (typeof value === "object" && Object.keys(value).length === 0)) {
        delete target[name];
        continue;
      }

      normalizeObject(target[name]);
    }
  }

  return target as PartialDeep<T>;
}
