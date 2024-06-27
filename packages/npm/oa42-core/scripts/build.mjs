#!/usr/bin/env node

import cp from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");
const workspaceRoot = path.resolve(dirname, "..", "..", "..", "..");

const options = {
  shell: true,
  stdio: "inherit",
  env: process.env,
  cwd: projectRoot,
};

cp.execFileSync(
  "cargo",
  ["build", "--package", "skiffa-core", "--target", "wasm32-unknown-unknown", "--release"],
  options,
);
cp.execFileSync(
  "wasm-bindgen",
  [
    "--target",
    "nodejs",
    "--out-dir",
    path.resolve(projectRoot, "dist"),
    path.resolve(workspaceRoot, "target", "wasm32-unknown-unknown", "release", "skiffa_core.wasm"),
  ],
  options,
);
