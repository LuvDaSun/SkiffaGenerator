import * as skiffaCore from "@skiffa/core";
import { packageInfo } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateRollupConfigJsCode() {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import path from "path";
    import { defineConfig } from "rollup";
  `;

  yield itt`
    const external = (id, parent, resolved) => !(id.startsWith(".") || path.isAbsolute(id));
    
    export default defineConfig([
    {
      external,
      input: path.resolve("transpiled", "main.js"),
      output: { file: path.resolve("bundled", "main.js"), format: "module" },
      context: "global",
    },
    {
      external,
      input: path.resolve("transpiled", "main.js"),
      output: { file: path.resolve("bundled", "main.cjs"), format: "commonjs" },
      context: "global",
    },
    {
      external,
      input: path.resolve("transpiled", "browser.js"),
      output: { file: path.resolve("bundled", "browser.js"), format: "module" },
      context: "window",
    },
  ]);
  `;
}
