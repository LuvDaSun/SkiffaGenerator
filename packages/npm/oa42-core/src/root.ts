import path from "path";
import { fileURLToPath } from "url";

export const projectRoot = makeProjectRoot();

/**
 * Constructs the project root directory path.
 * This function calculates the project root directory by first determining the directory name
 * of the current module (using the URL of the import.meta object) and then resolving the parent directory.
 *
 * @returns {string} The absolute path to the project root directory.
 */
function makeProjectRoot() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(dirname, "..");
}
