#!/usr/bin/env node

import fs from "fs";
import path from "path";

fs.rmSync(path.resolve("transpiled"), { recursive: true, force: true });
fs.rmSync(path.resolve("typed"), { recursive: true, force: true });
fs.rmSync(path.resolve("bundled"), { recursive: true, force: true });
