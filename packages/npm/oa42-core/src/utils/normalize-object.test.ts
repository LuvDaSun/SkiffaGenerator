import assert from "assert";
import test from "node:test";
import { normalizeObject } from "./normalize-object.js";

test("normalize-object", () => {
  assert.deepEqual(normalizeObject({ a: undefined }), {});
  assert.deepEqual(normalizeObject({ a: null }), {});
  assert.deepEqual(normalizeObject({ a: [] }), {});
  assert.deepEqual(normalizeObject({ a: {} }), {});
});
