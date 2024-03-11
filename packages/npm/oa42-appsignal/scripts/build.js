#!/usr/bin/env node

import cp from "child_process";
import path from "path";

const options = { shell: true, stdio: "inherit" };

cp.execFileSync("tsc", [], options);

cp.execFileSync(
  "rollup",
  [
    "--input",
    path.resolve("transpiled", "main.js"),
    "--file",
    path.resolve("bundled", "main.js"),
    "--sourcemap",
    "--format",
    "es",
  ],
  options,
);

cp.execFileSync(
  "rollup",
  [
    "--input",
    path.resolve("transpiled", "main.js"),
    "--file",
    path.resolve("bundled", "main.cjs"),
    "--sourcemap",
    "--format",
    "cjs",
  ],
  options,
);
