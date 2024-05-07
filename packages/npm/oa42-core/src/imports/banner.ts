import { CString, withErrorReference } from "../imports/index.js";
import { mainFfi } from "../main-ffi.js";

export function banner(prefix: string, version: string) {
  using prefixForeign = CString.fromString(prefix);
  using versionForeign = CString.fromString(version);

  const resultPointer = withErrorReference((errorReferencePointer) =>
    mainFfi.exports.banner(prefixForeign.pointer, versionForeign.pointer, errorReferencePointer),
  );

  using resultForeign = new CString(resultPointer);
  return resultForeign.toString();
}
