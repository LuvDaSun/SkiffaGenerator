import assert from "assert";
import test from "node:test";
import { toPascal } from "./name.js";

test("to pascal", (t) => {
  assert.strictEqual(toPascal("  1  one\\twoThree"), "OneTwoThree");
});
