import * as core from "@oa42/core";
import { itt, packageInfo } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode() {
  yield core.banner("//", `v${packageInfo.version}`);

  yield itt`
    export * from "./types.js";
    export * from "./validators.js";
    export * from "./parsers.js";
    export * from "./parameters.js";
    export * from "./shared.js";
    export * from "./client.js";
  `;
}
