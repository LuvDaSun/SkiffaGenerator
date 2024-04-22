import assert from "node:assert";
import test from "node:test";
import { NodeLocation } from "./node-location.js";

test("node-location set pointer", () => {
  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").setPointer(["j", "k", "l"]);
    using expected = NodeLocation.parse("http://a.b.c/d/e/f#/j/k/l");

    assert.equal(actual.toString(), expected.toString());
  }
});

test("node-location push pointer", () => {
  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").pushPointer(["j", "k", "l"]);
    using expected = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i/j/k/l");

    assert.equal(actual.toString(), expected.toString());
  }
});

test("node-location join", () => {
  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("http://x.y.z/"),
    );
    using expected = NodeLocation.parse("http://x.y.z/");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("c:\\x"),
    );
    using expected = NodeLocation.parse("c:/x");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("/x/y/z"),
    );
    using expected = NodeLocation.parse("http://a.b.c/x/y/z#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("/x/y/z/"),
    );
    using expected = NodeLocation.parse("http://a.b.c/x/y/z/#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("c:\\a\\d\\e\\f").join(NodeLocation.parse("/x/y/z/"));
    using expected = NodeLocation.parse("c:/x/y/z/#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f#/g/h/i").join(
      NodeLocation.parse("x/y/z/"),
    );
    using expected = NodeLocation.parse("http://a.b.c/d/e/x/y/z/#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("c:\\a\\d\\e\\f").join(NodeLocation.parse("x/y/z/"));
    using expected = NodeLocation.parse("c:/a/d/e/x/y/z/#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("x/y/z/"),
    );
    using expected = NodeLocation.parse("http://a.b.c/d/e/f/x/y/z/#");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("#/x/y/z/"),
    );
    using expected = NodeLocation.parse("http://a.b.c/d/e/f/#/x/y/z/");

    assert.equal(actual.toString(), expected.toString());
  }

  {
    using actual = NodeLocation.parse("http://a.b.c/d/e/f/#/g/h/i").join(
      NodeLocation.parse("?x=y"),
    );
    using expected = NodeLocation.parse("http://a.b.c/d/e/f/?x=y");

    assert.equal(actual.toString(), expected.toString());
  }
  {
    using actual = NodeLocation.parse("http://a.b.c/d/e?f#/g/h/i").join(NodeLocation.parse("?x=y"));
    using expected = NodeLocation.parse("http://a.b.c/d/e?x=y");

    assert.equal(actual.toString(), expected.toString());
  }
});
