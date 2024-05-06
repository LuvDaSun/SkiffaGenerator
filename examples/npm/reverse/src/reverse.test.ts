import assert from "assert";
import test from "node:test";
import { reverse } from "./reverse.js";

test("reverse", (t) => {
  const expected = "remle";
  const actual = reverse("elmer");
  assert.equal(actual, expected);
});
