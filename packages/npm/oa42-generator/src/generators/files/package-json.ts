import { PackageJson } from "type-fest";
import { withDependencies } from "../../utils/index.js";

export function generatePackageJsonData(name: string, version: string) {
  const content: PackageJson = {
    name: name,
    version: version,
    sideEffects: false,
    type: "module",
    main: "./bundled/main.cjs",
    module: "./bundled/main.js",
    types: "./types/main.d.ts",
    exports: {
      ".": {
        require: "./bundled/main.cjs",
        import: "./bundled/main.js",
        types: "./types/main.d.ts",
      },
    },
    files: ["./types/**", "./bundled/**"],
    scripts: {
      prepack: "node ./scripts/build.js",
      pretest: "node ./scripts/build.js",
      build: "node ./scripts/build.js",
      clean: "node ./scripts/clean.js",
      test: "node --test ./transpiled/**/*.test.js",
    },
    author: "",
    license: "ISC",
    dependencies: withDependencies(["@types/node", "goodrouter", "oa42-lib"]),
    devDependencies: withDependencies(["typescript", "rollup", "@tsconfig/node20"]),
  };

  return content;
}
