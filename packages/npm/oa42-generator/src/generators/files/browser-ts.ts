import { banner } from "@oa42/core";
import * as models from "../../models/index.js";
import { itt, packageInfo } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  yield itt`
    export * from "./types.js";
    export * from "./validators.js";
    export * from "./parsers.js";
    export * from "./parameters.js";
    export * from "./shared.js";
    export * from "./client.js";

    `;
}
