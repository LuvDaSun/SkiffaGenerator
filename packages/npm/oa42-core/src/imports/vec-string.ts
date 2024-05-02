import assert from "assert";
import { mainFfi } from "../main-ffi.js";
import { ForeignObject } from "../utils/foreign-object.js";
import { CString } from "./c-string.js";
import { withErrorReference } from "./with-error.js";

export class VecString extends ForeignObject {
  constructor(pointer: number) {
    super(pointer, () => mainFfi.exports.vec_string_drop(pointer));
  }

  public static fromArray(array: string[]) {
    const vec = VecString.new(array.length);
    for (const item of array) {
      vec.push(item);
    }
    assert.equal(vec.len(), array.length);
    return vec;
  }

  public toArray(): string[] {
    const len = this.len();
    const result = new Array(len);
    for (let index = 0; index < len; index++) {
      const value = this.get(index);
      result[index] = value;
    }
    return result;
  }

  public static new(capacity: number) {
    const pointer = mainFfi.exports.vec_string_new(capacity);
    return new VecString(pointer);
  }

  public len() {
    const result = mainFfi.exports.vec_string_len(this.pointer);
    return result;
  }

  public get(index: number) {
    const resultPointer = withErrorReference((errorReferencePointer) =>
      mainFfi.exports.vec_string_get(this.pointer, index, errorReferencePointer),
    );
    using resultForeign = new CString(resultPointer);
    resultForeign.abandon();
    const result = resultForeign.toString();
    return result;
  }

  public push(value: string) {
    using valueForeign = CString.fromString(value);
    valueForeign.abandon();
    withErrorReference((errorReferencePointer) =>
      mainFfi.exports.vec_string_push(this.pointer, valueForeign.pointer, errorReferencePointer),
    );
  }
}
