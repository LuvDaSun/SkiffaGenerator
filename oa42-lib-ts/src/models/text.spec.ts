import assert from "assert";
import test from "node:test";
import { PassThrough } from "stream";
import { deserializeTextLines, serializeTextLines } from "./text.js";

test("serialize-text-lines-iterable", async () => {
  const iterable = new PassThrough({ objectMode: true });
  const stream = serializeTextLines(iterable);

  iterable.write("a");
  iterable.write("");
  iterable.write("b");
  iterable.write("c");
  iterable.end();

  let actual = "";
  for await (const chunk of stream) {
    actual += Buffer.from(chunk).toString();
  }

  const expected = `a

b
c
`;
  assert.equal(actual, expected);
});

test("deserialize-text-lines-iterable", async () => {
  const stream = new PassThrough();
  const iterable = deserializeTextLines(() => stream);

  stream.write(`a

b
c
`);
  stream.end();

  const actual = new Array<string>();
  for await (const item of iterable) {
    actual.push(item);
  }

  const expected = ["a", "", "b", "c"];
  assert.deepEqual(actual, expected);
});
