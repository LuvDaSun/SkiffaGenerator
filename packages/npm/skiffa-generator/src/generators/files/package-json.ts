import { PackageJson } from "type-fest";
import { withDependencies } from "../../utils.js";

export function generatePackageJsonData(name: string, version: string) {
  const content: PackageJson = {
    name: name,
    version: version,
    sideEffects: false,
    type: "module",
    main: "./bundled/main.cjs",
    module: "./bundled/main.js",
    types: "./typed/main.d.ts",
    browser: "./bundled/browser.js",
    exports: {
      ".": {
        require: "./bundled/main.cjs",
        import: "./bundled/main.js",
        types: "./typed/main.d.ts",
        browser: "./bundled/browser.js",
      },
    },
    files: ["./typed/**", "./bundled/**"],
    scripts: {
      prepack: "node ./scripts/build.js",
      pretest: "tsc",
      build: "node ./scripts/build.js",
      clean: "node ./scripts/clean.js",
      test: "node --test ./transpiled/examples.test.js ./transpiled/mocks.test.js ./transpiled/client-server.test.js",
    },
    author: "",
    license: "ISC",
    dependencies: withDependencies(["@types/node", "goodrouter", "@skiffa/lib"]),
    devDependencies: withDependencies(["typescript", "rollup", "@tsconfig/node18"]),
    engines: {
      node: ">=18",
    },
  };

  return content;
}
