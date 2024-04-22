import { mainFfi } from "../main-ffi.js";
import { ForeignObject } from "../utils/foreign-object.js";

export class Reference extends ForeignObject {
  constructor(pointer: number) {
    super(pointer, () => mainFfi.exports.reference_drop(pointer));
  }

  public static new(target: number = 0) {
    const pointer = mainFfi.exports.reference_new();
    mainFfi.memoryView.setUint32(pointer, target, true);
    return new Reference(pointer);
  }

  public get target(): number {
    const { pointer } = this;
    const value = mainFfi.memoryView.getUint32(pointer, true);
    return value;
  }

  public set target(value: number) {
    const { pointer } = this;
    mainFfi.memoryView.setUint32(pointer, value, true);
  }
}
