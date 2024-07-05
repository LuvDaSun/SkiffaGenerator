import * as skiffaCore from "@skiffa/core";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

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
    export * as shared from "./shared.js";
    export * as client from "./client.js";
    export * as facade from "./facade.js";
    export * as server from "./server.js";
  `;
}
