import { banner } from "@oa42/core";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

/**
 * Main entrypoint for the package, exports client and server and
 * dependencies
 */
export function* generateMainTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  yield itt`
    export * from "oa42-lib";
    export * from "./types.js";
    export * from "./validators.js";
    export * from "./parsers.js";
    export * from "./parameters.js";
    export * from "./shared.js";
    export * from "./client.js";
    export * from "./server.js";
    export * from "./mocks.js";
  `;
}
