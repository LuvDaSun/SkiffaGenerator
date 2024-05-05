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
    export * as lib from "oa42-lib";

    export * as types from "./types.js";
    export * as validators from "./validators.js";
    export * as parsers from "./parsers.js";
    export * as parameters from "./parameters.js";
    export * as mocks from "./mocks.js";

    export * from "./shared.js";
    export * from "./client.js";
    export * from "./server.js";
    `;
}
