#!/usr/bin/env node

import cp from "child_process";
import path from "path";

cp.execFileSync("tsc", [], { shell: true });

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
  { shell: true },
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
  { shell: true },
);
