import assert from "node:assert";
import test from "node:test";
import { NodeLocation, urlRegExp } from "./node-location.js";

test("node-location path normalization", () => {
  {
    const actual = NodeLocation.parse("/a/b/../c").path;
    const expected = ["", "a", "c"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("/../../a/b/c").path;
    const expected = ["", "a", "b", "c"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("../../a/b/c").path;
    const expected = ["..", "..", "a", "b", "c"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("a/b/c/../../../../x").path;
    const expected = ["..", "x"];

    assert.deepEqual(actual, expected);
  }
});

test("urlRexExp", () => {
  {
    const actual = urlRegExp.exec("http://www.example.com")?.slice(1);
    const expected = ["http://www.example.com", undefined, undefined, undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("http://www.example.com/")?.slice(1);
    const expected = ["http://www.example.com", "/", undefined, undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("http://www.example.com/a/b/c")?.slice(1);
    const expected = ["http://www.example.com", "/a/b/c", undefined, undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("http://www.example.com/a/b/c?123")?.slice(1);
    const expected = ["http://www.example.com", "/a/b/c", "?123", undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("http://www.example.com/a/b/c?123#xxx")?.slice(1);
    const expected = ["http://www.example.com", "/a/b/c", "?123", "#xxx"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("http://www.example.com/a/b/c#xxx")?.slice(1);
    const expected = ["http://www.example.com", "/a/b/c", undefined, "#xxx"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("/a/b/c#xxx")?.slice(1);
    const expected = [undefined, "/a/b/c", undefined, "#xxx"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("a/b/c?xxx")?.slice(1);
    const expected = [undefined, "a/b/c", "?xxx", undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("whoop")?.slice(1);
    const expected = [undefined, "whoop", undefined, undefined];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = urlRegExp.exec("#")?.slice(1);
    const expected = [undefined, undefined, undefined, "#"];

    assert.deepEqual(actual, expected);
  }
});

test("node-location parse path", () => {
  {
    const actual = NodeLocation.parse("a").path;
    const expected = ["a"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("a#").path;
    const expected = ["a"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("a#/").path;
    const expected = ["a"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("a#/1/2/3").path;
    const expected = ["a"];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("a#/1/2/3#").path;
    const expected = ["a"];

    assert.deepEqual(actual, expected);
  }
});

test("node-location parse pointer", () => {
  {
    const actual = NodeLocation.parse("").pointer;
    const expected: string[] = [];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("#").pointer;
    const expected: string[] = [];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("#/").pointer;
    const expected = [""];

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("#/1/2/3").pointer;
    const expected = ["1", "2", "3"];

    assert.deepEqual(actual, expected);
  }
});

test("node-location join", () => {
  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("http://x.y.z/"),
    );
    const expected = NodeLocation.parse("http://x.y.z/");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("c:\\x"),
    );
    const expected = NodeLocation.parse("c:/x");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("/x/y/z"),
    );
    const expected = NodeLocation.parse("http://a.b.c/x/y/z#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("/x/y/z/"),
    );
    const expected = NodeLocation.parse("http://a.b.c/x/y/z/#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("c:\\a\\d\\e\\f").join(NodeLocation.parse("/x/y/z/"));
    const expected = NodeLocation.parse("c:/x/y/z/#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("x/y/z/"),
    );
    const expected = NodeLocation.parse("http://a.b.c/d/e/x/y/z/#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("c:\\a\\d\\e\\f").join(NodeLocation.parse("x/y/z/"));
    const expected = NodeLocation.parse("c:/a/d/e/x/y/z/#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("x/y/z/"),
    );
    const expected = NodeLocation.parse("http://a.b.c/d/e/f/x/y/z/#");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("#/x/y/z/"),
    );
    const expected = NodeLocation.parse("http://a.b.c/d/e/f/#/x/y/z/");

    assert.deepEqual(actual, expected);
  }

  {
    const actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("?x=y"),
    );
    const expected = NodeLocation.parse("http://a.b.c/d/e/f/?x=y");

    assert.deepEqual(actual, expected);
  }
  {
    const actual = NodeLocation.parse("http://a.b.c/d/e?f#/g/h/i").join(NodeLocation.parse("?x=y"));
    const expected = NodeLocation.parse("http://a.b.c/d/e?x=y");

    assert.deepEqual(actual, expected);
  }
});

test("node-location escape", () => {
  const actual = NodeLocation.escapePointer("~~//:-)");
  const expected = "~0~0~1~1:-)";

  assert.equal(actual, expected);
});

test("node-location unescape", () => {
  const actual = NodeLocation.unescapePointer("~~~0~~~1~01:-)");
  const expected = "~~~~~/~1:-)";

  assert.equal(actual, expected);
});
