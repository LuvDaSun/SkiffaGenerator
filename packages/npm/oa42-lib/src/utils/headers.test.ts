import assert from "assert";
import test from "node:test";
import { parseAcceptHeader } from "./headers.js";

test("accept", async (t) => {
  {
    const actual = parseAcceptHeader(["text/html; q=0.1, application/octet-stream", "text/plain"]);
    const expected = ["application/octet-stream", "text/plain", "text/html"];
    assert.deepEqual(actual, expected);
  }
});
