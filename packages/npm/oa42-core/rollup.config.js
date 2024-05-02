import replace from "@rollup/plugin-replace";
import path from "path";
import { defineConfig } from "rollup";

const external = (id, parent, resolved) => !(id.startsWith(".") || path.isAbsolute(id));

export default defineConfig([
  {
    external,
    input: path.resolve("transpiled", "main.js"),
    output: { file: path.resolve("bundled", "main.js"), format: "module", sourcemap: true },
    context: "global",
    plugins: [
      replace({
        values: {
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        },
        preventAssignment: true,
      }),
    ],
  },
  {
    external,
    input: path.resolve("transpiled", "main.js"),
    output: { file: path.resolve("bundled", "main.cjs"), format: "commonjs", sourcemap: true },
    context: "global",
    plugins: [
      replace({
        values: {
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        },
        preventAssignment: true,
      }),
    ],
  },
]);
