#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..");

fs.rmSync(path.resolve(projectRoot, "dist"), { recursive: true, force: true });
