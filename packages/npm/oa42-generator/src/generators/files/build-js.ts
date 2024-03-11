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
    const options = { shell: true, stdio: "inherit" };

    cp.execFileSync("tsc", [], options);
    
    cp.execFileSync(
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
      options,
    );
    
    cp.execFileSync(
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
      options,
    );
    
  `;
}
