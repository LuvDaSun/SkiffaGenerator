import assert from "assert";
import test from "node:test";
import { PassThrough } from "stream";
import { isNativeError } from "util/types";
import { deserializeJsonEntities, serializeJsonEntities } from "./json.js";

test("serialize-json-iterable", async () => {
  const iterable = new PassThrough({ objectMode: true });
  const stream = serializeJsonEntities(iterable);

  iterable.write("a");
  iterable.write("");
  iterable.write("b");
  iterable.write("c");
  iterable.write({ a: 1 });
  iterable.write({ b: 2 });
  iterable.write(true);
  iterable.write(1);
  iterable.write(2);
  iterable.write(3);
  iterable.end();

  let actual = "";
  for await (const chunk of stream) {
    actual += Buffer.from(chunk).toString();
  }

  const expected = `"a"
""
"b"
"c"
{"a":1}
{"b":2}
true
1
2
3
`;
  assert.equal(actual, expected);
});

test("deserialize-json-iterable", async (t) => {
  const stream = new PassThrough();
  const iterable = deserializeJsonEntities(() => stream);

  stream.write(`"a"
        
"b"
"c"
 
{"a":1}
    
       
{"b":2}
true
1
2
3
`);
  stream.end();

  const actual = new Array<unknown>();
  for await (const item of iterable) {
    actual.push(item);
  }

  const expected = ["a", "b", "c", { a: 1 }, { b: 2 }, true, 1, 2, 3];
  assert.deepEqual(actual, expected);
});

test("deserialize-json-iterable error", async (t) => {
  const stream = new PassThrough();
  const iterable = deserializeJsonEntities(() => stream);

  stream.write('"a"\n');
  stream.write('"b"\n');
  stream.write('"c"\n');
  stream.destroy(new Error("error!"));

  try {
    for await (const item of iterable) {
      break;
    }
    assert.fail("expected error");
  } catch (error) {
    assert(isNativeError(error));
    assert.equal(error.message, "error!");
  }
});
