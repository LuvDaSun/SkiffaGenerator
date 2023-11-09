import * as fs from "fs";
import * as path from "path";
import { PackageJson } from "type-fest";
import { projectRoot } from "./root.js";

export const packageInfo = readPackageInfo();

function readPackageInfo() {
  const content = fs.readFileSync(
    path.join(projectRoot, "package.json"),
    "utf8",
  );
  return JSON.parse(content) as PackageJson;
}

export function withDependencies(names: string[]) {
  return names.reduce(
    (o, name) =>
      Object.assign(o, {
        [name]:
          packageInfo.dependencies?.[name] ??
          packageInfo.devDependencies?.[name],
      }),
    {},
  );
}
