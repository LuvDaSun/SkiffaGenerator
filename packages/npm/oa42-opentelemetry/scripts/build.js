#!/usr/bin/env node

import cp from "child_process";
import path from "path";

cp.spawnSync("tsc", [], { stdio: "inherit" });

cp.spawnSync(
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
    { stdio: "inherit" },
);

cp.spawnSync(
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
    { stdio: "inherit" },
);
