#!/usr/bin/env node

import fs from "fs";
import path from "path";

const projectRoot = path.resolve(import.meta.dirname, "..");

fs.rmSync(path.resolve(projectRoot, "transpiled"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "types"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "bundled"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "bin"), { recursive: true, force: true });
