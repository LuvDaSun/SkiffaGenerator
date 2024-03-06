import assert from "assert";
import test from "node:test";
import { toUrl } from "./url.js";

test("to-url", () => {
  {
    const actual = toUrl("/a/b/c");
    const expected = new URL("file:///a/b/c");
    assert.equal(actual.toString(), expected.toString());
  }
  {
    const actual = toUrl("http://a.b.c/");
    const expected = new URL("http://a.b.c/");
    assert.equal(actual.toString(), expected.toString());
  }
});
