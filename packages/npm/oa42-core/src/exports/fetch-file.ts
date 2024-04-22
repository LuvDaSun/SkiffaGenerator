import fs from "fs/promises";
import { CString, Reference } from "../imports/index.js";

/**
 * Fetches the content of a file from a given location and updates a data reference pointer with the content.
 * This function supports fetching from both local file paths and remote URLs (http/https).
 *
 * @param locationPointer A number representing the memory address of a C-style string (null-terminated) that contains the file location.
 * @param dataReferencePointer A number representing the memory address of a Reference object where the fetched data's pointer will be stored.
 *
 * @returns {Promise<void>} A promise that resolves when the operation is complete. Does not return any value.
 *
 * @remarks
 * The function uses `CString` to handle C-style string operations and `Reference` to manage memory references.
 * It automatically determines whether the location is a local path or a remote URL and fetches the data accordingly.
 * After fetching, the data is converted to a `CString` and its pointer is stored in the provided `Reference` object.
 * The `Reference` and `CString` objects used internally are properly managed to avoid memory leaks.
 */
export async function fetchFile(locationPointer: number, dataReferencePointer: number) {
  using locationForeign = new CString(locationPointer);
  using dataReferenceForeign = new Reference(dataReferencePointer);

  const location = locationForeign.toString();
  const locationLower = location.toLowerCase();
  let data: string | undefined;
  if (locationLower.startsWith("http://") || locationLower.startsWith("https://")) {
    const result = await fetch(location);
    data = await result.text();
  } else {
    data = await fs.readFile(location, "utf-8");
  }

  using dataForeign = CString.fromString(data);
  dataForeign.abandon();

  dataReferenceForeign.target = dataForeign.pointer;
  dataReferenceForeign.abandon();
}
