import { mainFfi } from "../main-ffi.js";
import { ForeignObject } from "../utils/foreign-object.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

/**
 * Represents a C-style string as a foreign object within TypeScript.
 * This class provides methods to interact with strings across the FFI boundary.
 */
export class CString extends ForeignObject {
  /**
   * Constructs a new CString instance.
   * @param pointer The memory address (pointer) of the C string in the foreign function interface.
   */
  constructor(pointer: number) {
    super(pointer, () => mainFfi.exports.c_string_drop(pointer));
  }

  /**
   * Creates a CString instance from a JavaScript string.
   * @param value The JavaScript string to convert into a CString.
   * @returns A new CString instance representing the given JavaScript string.
   */
  public static fromString(value: string): CString {
    const data = textEncoder.encode(value); // Encode the string into a Uint8Array.
    const pointer = mainFfi.exports.c_string_new(data.length); // Allocate memory for the string in the FFI.
    mainFfi.memoryUint8.set(data, pointer); // Copy the encoded string to the allocated memory.
    return new CString(pointer); // Return a new CString instance pointing to the string.
  }

  /**
   * Converts the CString back into a JavaScript string.
   * @returns The JavaScript string representation of the CString.
   * @throws {TypeError} If the CString size cannot be determined.
   */
  public toString(): string {
    const { pointer } = this;
    const index = mainFfi.memoryUint8.indexOf(0, pointer); // Find the null terminator to determine the string size.
    if (index < 0) {
      throw new TypeError("cstring size not found"); // Throw an error if the null terminator is not found.
    }
    const data = mainFfi.memoryUint8.subarray(pointer, index); // Extract the string data up to the null terminator.
    const value = textDecoder.decode(data); // Decode the data back into a JavaScript string.
    return value;
  }
}
