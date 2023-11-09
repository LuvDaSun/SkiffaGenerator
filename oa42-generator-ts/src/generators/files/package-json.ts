import { PackageJson } from "type-fest";
import { withDependencies } from "../../utils/index.js";

export function generatePackageJsonData(name: string, version: string) {
  const content: PackageJson = {
    name: name,
    version: version,
    sideEffects: false,
    type: "module",
    main: "./main.js",
    types: "./main.d.ts",
    files: ["*"],
    exports: {
      ".": {
        default: "./main.js",
        browser: "./browser.js",
      },
    },
    scripts: {
      prepare: "tsc",
      test: "node --test ./*.spec.js",
    },
    author: "",
    license: "ISC",
    dependencies: withDependencies([
      "@types/node",
      "goodrouter",
      "@oa42/oa42-lib",
    ]),
    devDependencies: withDependencies(["typescript"]),
  };

  return content;
}
