import assert from "assert";
import test from "node:test";
import { packageInfo } from "./package.js";

test("package version", (t) => {
  assert.strictEqual(packageInfo.version, "0.0.0");
});
