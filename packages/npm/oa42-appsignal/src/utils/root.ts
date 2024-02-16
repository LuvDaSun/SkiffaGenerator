import * as path from "path";
import { fileURLToPath } from "url";

export const projectRoot = makeProjectRoot();

function makeProjectRoot() {
  let dirname: string;
  if (typeof __dirname === "undefined") {
    dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
  } else {
    dirname = __dirname;
  }
  return path.resolve(dirname, "..", "..");
}
