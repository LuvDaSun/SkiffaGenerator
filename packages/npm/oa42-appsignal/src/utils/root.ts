import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  let dirname = import.meta.dirname;
  return path.resolve(dirname, "..", "..");
}
