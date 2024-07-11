#!/usr/bin/env node

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import * as programs from "./programs.js";

main();

async function main() {
  const program = yargs(hideBin(process.argv));

  programs.configurePackageProgram(program);

  program.parse();
}
