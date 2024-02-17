import { PackageJson } from "type-fest";
import { withDependencies } from "../../utils/index.js";

export function generatePackageJsonData(name: string, version: string) {
  const content: PackageJson = {
    name: name,
    version: version,
    sideEffects: false,
    type: "module",
    main: "./out-commonjs/main.js",
    module: "./out/main.js",
    types: "./out/main.d.ts",
    browser: "./out/browser.js",
    exports: {
      ".": {
        require: "./out-commonjs/main.js",
        import: "./out/main.js",
        types: "./out/main.d.ts",
        browser: "./out/browser.js",
      },
    },
    files: ["./out/**", "./out-commonjs/**"],
    scripts: {
      prepack: `tsc ; tsc --outDir out-commonjs --declaration false --module commonjs --moduleResolution Node10 ; echo '{"type":"commonjs"}' > out-commonjs/package.json`,
      pretest: `tsc ; tsc --outDir out-commonjs --declaration false --module commonjs --moduleResolution Node10 ; echo '{"type":"commonjs"}' > out-commonjs/package.json`,
      build: `tsc ; tsc --outDir out-commonjs --declaration false --module commonjs --moduleResolution Node10 ; echo '{"type":"commonjs"}' > out-commonjs/package.json`,
      clean: "rm -rf out out-*",
      test: "node --test ./out/**/*.test.js",
    },
    author: "",
    license: "ISC",
    dependencies: withDependencies(["@types/node", "goodrouter", "oa42-lib"]),
    devDependencies: withDependencies(["typescript", "@tsconfig/node20"]),
  };

  return content;
}
