#!/usr/bin/env node

import cp from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");

const options = { shell: true, stdio: "inherit", env: process.env, cwd: projectRoot };

cp.execFileSync("tsc", [], options);
cp.execFileSync("rollup", ["--config", path.resolve(projectRoot, "rollup.config.js")], options);

cp.execFileSync("npm", ["--workspace", "@oa42/core", "run", "build"], options);
cp.execFileSync("npm", ["--workspace", "oa42-lib", "run", "build"], options);
