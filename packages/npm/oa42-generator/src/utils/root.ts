import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  let dirname: string;
  if (typeof require === "undefined") {
    dirname = eval("import.meta.dirname");
  } else {
    dirname = eval("__dirname");
  }
  return path.resolve(dirname, "..", "..");
}
