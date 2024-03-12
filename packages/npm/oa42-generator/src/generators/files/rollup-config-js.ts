import { banner } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateRollupConfigJsCode() {
  yield banner;

  yield itt`
  import replace from "@rollup/plugin-replace";
  import path from "path";
  import { defineConfig } from "rollup";
`;

  yield itt`
    const external = (id, parent, resolved) => !(id.startsWith(".") || path.isAbsolute(id));
    
    export default defineConfig([
    {
      external,
      input: path.resolve("transpiled", "main.js"),
      output: { file: path.resolve("bundled", "main.js"), format: "module", sourcemap: true },
    },
    {
      external,
      input: path.resolve("transpiled", "main.js"),
      output: { file: path.resolve("bundled", "main.cjs"), format: "commonjs", sourcemap: true },
    },
  ]);
  `;
}
