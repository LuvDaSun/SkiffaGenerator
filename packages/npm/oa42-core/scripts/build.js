#!/usr/bin/env node

import cp from "child_process";
import fs from "fs";
import path from "path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "..", "..", "..");

const options = { shell: true, stdio: "inherit", env: process.env };

cp.execFileSync("tsc", ["--project", path.resolve(projectRoot, "tsconfig.json")], options);

cp.execFileSync("rollup", ["--config", path.resolve(projectRoot, "rollup.config.js")], options);

cp.execFileSync(
  "cargo",
  ["build", "--package", "oa42-core", "--target", "wasm32-unknown-unknown", "--release"],
  options,
);

fs.mkdirSync(path.resolve(projectRoot, "bin"), { recursive: true });

fs.copyFileSync(
  path.resolve(workspaceRoot, "target", "wasm32-unknown-unknown", "release", "oa42_core.wasm"),
  path.resolve(projectRoot, "bin", "main.wasm"),
);
