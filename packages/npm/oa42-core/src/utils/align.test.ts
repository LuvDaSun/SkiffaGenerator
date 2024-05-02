import assert from "assert";
import test from "node:test";
import { align } from "./align.js";

test("align", () => {
  assert(align(0, 3) === 0);
  assert(align(1, 3) === 3);
  assert(align(2, 3) === 3);
  assert(align(3, 3) === 3);
  assert(align(4, 3) === 6);
});
