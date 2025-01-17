import * as skiffaCore from "@skiffa/core";
import { itt, packageInfo } from "../../utils.js";

export function* generateCleanJsCode() {
  yield itt`
    #!/usr/bin/env node
  `;

  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import fs from "fs";
    import path from "path";
  `;

  yield itt`
    fs.rmSync(path.resolve("transpiled"), { recursive: true, force: true });
    fs.rmSync(path.resolve("typed"), { recursive: true, force: true });
    fs.rmSync(path.resolve("bundled"), { recursive: true, force: true });
  `;
}
