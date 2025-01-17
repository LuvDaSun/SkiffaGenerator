import * as skiffaCore from "@skiffa/core";
import { itt, packageInfo } from "../../utils.js";

export function* generateBuildJsCode() {
  yield itt`
    #!/usr/bin/env node
  `;

  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import cp from "child_process";
    import path from "path";
  `;

  yield itt`
    const options = { shell: true, stdio: "inherit" };
    
    cp.execFileSync("tsc", [], options);
    
    cp.execFileSync("rollup", ["--config", path.resolve("rollup.config.js")], options);
  `;
}
