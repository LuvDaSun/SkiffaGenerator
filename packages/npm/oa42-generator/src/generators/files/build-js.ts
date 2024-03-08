import { banner } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateBuildJsCode() {
  yield itt`
    #!/usr/bin/env node
  `;

  yield banner;

  yield itt`
    import cp from "child_process";
    import path from "path";
  `;

  yield itt`
    cp.spawnSync("tsc", [], { stdio: "inherit" });
    
    cp.spawnSync(
      "rollup",
      [
        "--input",
        path.resolve("transpiled", "main.js"),
        "--file",
        path.resolve("bundled", "main.js"),
        "--sourcemap",
        "--format",
        "es",
      ],
      { stdio: "inherit" },
    );
    
    cp.spawnSync(
      "rollup",
      [
        "--input",
        path.resolve("transpiled", "main.js"),
        "--file",
        path.resolve("bundled", "main.cjs"),
        "--sourcemap",
        "--format",
        "cjs",
      ],
      { stdio: "inherit" },
    );
    
  `;
}
