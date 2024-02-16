import path from "path";

export const projectRoot = getProjectRoot();

function getProjectRoot() {
  let dirname: string;
  if (typeof __dirname === "undefined") {
    dirname = eval("import.meta.dirname");
  } else {
    dirname = __dirname;
  }

  return path.resolve(dirname, "..", "..");
}
