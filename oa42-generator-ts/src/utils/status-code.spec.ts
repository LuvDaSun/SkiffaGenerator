import assert from "assert";
import test from "node:test";
import { statusKindComparer, takeStatusCodes } from "./status-code.js";

test("takeStatusCodes", async (t) => {
  const availableStatusCodes = new Set<number>([100, 200, 201, 300, 400, 500]);

  assert.deepEqual([...takeStatusCodes(availableStatusCodes, "100")], [100]);

  assert.deepEqual(
    [...takeStatusCodes(availableStatusCodes, "2XX")],
    [200, 201],
  );

  assert.deepEqual(
    [...takeStatusCodes(availableStatusCodes, "default")],
    [300, 400, 500],
  );

  assert.deepEqual([...availableStatusCodes], []);
});

test("sort status kind", async (t) => {
  const actual = ["default", "100", "1XX"];
  actual.sort(statusKindComparer);

  const expected = ["100", "1XX", "default"];

  assert.deepEqual(actual, expected);
});
