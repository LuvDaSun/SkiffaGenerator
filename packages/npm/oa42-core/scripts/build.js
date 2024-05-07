#!/usr/bin/env node

import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");
const workspaceRoot = path.resolve(dirname, "..", "..", "..", "..");

const options = { shell: true, stdio: "inherit", env: process.env, cwd: projectRoot };

cp.execFileSync("tsc", [], options);
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
