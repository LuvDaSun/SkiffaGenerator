import assert from "assert";
import test from "node:test";
import { readNode } from "./read-node.js";

test("read node", (t) => {
  const actual = [
    ...readNode([], {
      a: "b",
      c: ["d", "e"],
    }),
  ];

  const expected = [
    [
      [],
      {
        a: "b",
        c: ["d", "e"],
      },
    ],
    [["a"], "b"],
    [["c"], ["d", "e"]],
    [["c", "0"], "d"],
    [["c", "1"], "e"],
  ];

  assert.deepStrictEqual(actual, expected);
});
