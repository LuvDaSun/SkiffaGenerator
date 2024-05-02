#!/usr/bin/env node

import cp from "child_process";
import path from "path";

const options = { shell: true, stdio: "inherit" };

cp.execFileSync("tsc", [], options);

cp.execFileSync("rollup", ["--config", path.resolve("rollup.config.js")], options);

cp.execFileSync("npm", ["--workspace", "@oa42/core", "run", "build"], options);
cp.execFileSync("npm", ["--workspace", "oa42-lib", "run", "build"], options);
