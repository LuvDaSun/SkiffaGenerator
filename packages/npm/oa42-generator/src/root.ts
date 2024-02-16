import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  const dirname = import.meta.dirname ?? __dirname;
  return path.resolve(dirname, "..");
}
