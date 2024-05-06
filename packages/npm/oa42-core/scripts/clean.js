#!/usr/bin/env node

import fs from "fs";
import path from "path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");

fs.rmSync(path.resolve(projectRoot, "transpiled"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "typed"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "bundled"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "bin"), { recursive: true, force: true });
