import assert from "assert";
import test from "node:test";
import { getParameterValues, parseParameters } from "./parameters.js";

test("read-parameter", () => {
  const parameters = {
    string: ["hi"],
    number: ["10.5"],
    integer: ["10"],
  };

  {
    const actual = getParameterValues(parameters, "string");
    const expected = ["hi"];
    assert.deepEqual(actual, expected);
  }
  {
    const actual = getParameterValues(parameters, "no");
    const expected: string[] = [];
    assert.deepEqual(actual, expected);
  }
});

test("parse-parameters", () => {
  assert.deepEqual(parseParameters(["a:1,b:2"], "", ",", ":"), {
    a: "1",
    b: "2",
  });

  assert.deepEqual(parseParameters(["a,1,b,2"], "", ",", ","), {
    a: "1",
    b: "2",
  });

  assert.deepEqual(parseParameters(["a:1", "b:2"], "", ",", ":"), {
    a: "1",
    b: "2",
  });

  assert.deepEqual(parseParameters(["a,1", "b,2"], "", ",", ","), {
    a: "1",
    b: "2",
  });
});
