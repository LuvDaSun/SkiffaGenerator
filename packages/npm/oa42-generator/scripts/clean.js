#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");

fs.rmSync(path.resolve(projectRoot, "transpiled"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "typed"), { recursive: true, force: true });
fs.rmSync(path.resolve(projectRoot, "bundled"), { recursive: true, force: true });
