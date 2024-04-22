import { mainFfi } from "../main-ffi.js";
import { CString } from "../main.js";
import { align } from "./align.js";
import { ForeignObject } from "./foreign-object.js";

export type ForeignPrimitive =
  | "boolean"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "i8"
  | "i16"
  | "i32"
  | "i64"
  | "f32"
  | "f64"
  | "cstring";

export class ForeignStructureBuilder<P extends object> {
  private properties = new Array<[string, ForeignPrimitive]>();
  private drop?: () => void;
  private align = 2;

  constructor() {}

  public addProperty<N extends string>(
    name: N,
    type: "boolean",
  ): ForeignStructureBuilder<P & Record<N, boolean>>;
  public addProperty<N extends string>(
    name: N,
    type: "u8" | "u16" | "u32" | "u64" | "i8" | "i16" | "i32" | "i64" | "f32" | "f64",
  ): ForeignStructureBuilder<P & Record<N, number>>;
  public addProperty<N extends string>(
    name: N,
    type: "cstring",
  ): ForeignStructureBuilder<P & Record<N, string>>;
  public addProperty<N extends string>(name: N, type: ForeignPrimitive) {
    const clone = new ForeignStructureBuilder<P>();
    clone.properties = [...this.properties, [name, type]];
    clone.drop = this.drop;
    clone.align = this.align;
    return clone;
  }

  public setDrop(value: () => number) {
    const clone = new ForeignStructureBuilder<P>();
    clone.properties = this.properties;
    clone.drop = value;
    clone.align = this.align;
    return clone;
  }

  public setAlign(value: number) {
    const clone = new ForeignStructureBuilder<P>();
    clone.properties = this.properties;
    clone.drop = this.drop;
    clone.align = value;
    return clone;
  }

  public build() {
    const { drop } = this;

    const Type = class extends ForeignObject {
      constructor(pointer: number) {
        super(pointer, drop);
      }
    } as new (pointer: number) => ForeignObject & P;

    let offset = 0;
    for (const [name, type] of this.properties) {
      switch (type) {
        case "boolean":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return Boolean(mainFfi.memoryView.getUint8(this.pointer + offset));
            },
            set(value: boolean) {
              mainFfi.memoryView.setUint8(this.pointer + offset, Number(value));
            },
          });
          offset += 1;
          break;
        case "u8":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getUint8(this.pointer + offset);
            },
            set(value: number) {
              mainFfi.memoryView.setUint8(this.pointer + offset, value);
            },
          });
          offset += 1;
          break;
        case "u16":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getUint16(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setUint16(this.pointer + offset, value, true);
            },
          });
          offset += 2;
          break;
        case "u32":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getUint32(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setUint32(this.pointer + offset, value, true);
            },
          });
          offset += 4;
          break;
        case "u64":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getBigUint64(this.pointer + offset, true);
            },
            set(value: bigint) {
              mainFfi.memoryView.setBigUint64(this.pointer + offset, value, true);
            },
          });
          offset += 8;
          break;
        case "i8":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getInt8(this.pointer + offset);
            },
            set(value: number) {
              mainFfi.memoryView.setInt8(this.pointer + offset, value);
            },
          });
          offset += 1;
          break;
        case "i16":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getInt16(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setInt16(this.pointer + offset, value, true);
            },
          });
          offset += 2;
          break;
        case "i32":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getInt32(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setInt32(this.pointer + offset, value, true);
            },
          });
          offset += 4;
          break;
        case "i64":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getBigInt64(this.pointer + offset, true);
            },
            set(value: bigint) {
              mainFfi.memoryView.setBigInt64(this.pointer + offset, value, true);
            },
          });
          offset += 8;
          break;
        case "f32":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getFloat32(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setFloat32(this.pointer + offset, value, true);
            },
          });
          offset += 4;
          break;
        case "f64":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              return mainFfi.memoryView.getFloat64(this.pointer + offset, true);
            },
            set(value: number) {
              mainFfi.memoryView.setFloat64(this.pointer + offset, value, true);
            },
          });
          offset += 8;
          break;
        case "cstring":
          Object.defineProperty(Type.prototype, name, {
            enumerable: true,
            get() {
              const stringPointer = mainFfi.memoryView.getUint32(this.pointer + offset, true);
              return new CString(stringPointer);
            },
            set(value: CString) {
              const stringPointer = value.pointer;
              mainFfi.memoryView.setUint32(this.pointer + offset, stringPointer, true);
            },
          });
          offset += 4;
          break;
      }
      // align
      offset = align(offset, this.align);
    }

    return Type;
  }
}
