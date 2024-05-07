import assert from "assert";
import test from "node:test";
import { VecString } from "./vec-string.js";

test("vec-string", () => {
  const vec = VecString.new(5);
  assert.equal(vec.len(), 0);

  vec.push("a");
  assert.equal(vec.get(0), "a");
  assert.equal(vec.len(), 1);

  vec.push("b");
  assert.equal(vec.get(1), "b");
  assert.equal(vec.len(), 2);
});
