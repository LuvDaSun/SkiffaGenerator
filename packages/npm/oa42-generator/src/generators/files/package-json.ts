import { PackageJson } from "type-fest";
import { withDependencies } from "../../utils/index.js";

export function generatePackageJsonData(name: string, version: string) {
  const content: PackageJson = {
    name: name,
    version: version,
    type: "module",
    main: "./out/main.js",
    types: "./out/main.d.ts",
    files: ["./src/*", "./out/*"],
    exports: {
      ".": {
        default: "./out/main.js",
        browser: "./out/browser.js",
      },
      "./types": {
        default: "./out/types.js",
      },
      "./validators": {
        default: "./out/validators.js",
      },
      "./parsers": {
        default: "./out/parsers.js",
      },
      "./parameters": {
        default: "./out/parameters.js",
      },
      "./shared": {
        default: "./out/shared.js",
      },
      "./client": {
        default: "./out/client.js",
      },
      "./server": {
        default: "./out/server.js",
      },
    },
    scripts: {
      prepack: "tsc --build",
      pretest: "tsc --build",
      build: "tsc --build",
      clean: "rm -rf ./out && tsc --build --clean",
      test: "node --test ./out/*.test.js",
    },
    author: "",
    license: "ISC",
    dependencies: withDependencies(["@types/node", "goodrouter", "oa42-lib"]),
    devDependencies: withDependencies(["typescript", "@tsconfig/node20"]),
  };

  return content;
}
