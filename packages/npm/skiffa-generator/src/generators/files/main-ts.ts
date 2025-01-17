import * as skiffaCore from "@skiffa/core";
import { itt, packageInfo } from "../../utils.js";

/**
 * Main entrypoint for the package, exports client and server and
 * dependencies
 */
export function* generateMainTsCode() {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    export * as lib from "@skiffa/lib";

    export * as types from "./types.js";
    export * as validators from "./validators.js";
    export * as parsers from "./parsers.js";
    export * as parameters from "./parameters.js";
    export * as mocks from "./mocks.js";
    export * as accept from "./accept.js";
    export * as client from "./client.js";
    export * as server from "./server.js";

    export { router } from "./router.js";
  `;
}
