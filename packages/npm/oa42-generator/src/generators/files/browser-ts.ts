import * as skiffaCore from "@skiffa/core";
import { itt, packageInfo } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode() {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    export * as lib from "skiffa-lib";

    export * as types from "./types.js";
    export * as validators from "./validators.js";
    export * as parsers from "./parsers.js";
    export * as parameters from "./parameters.js";
    export * as mocks from "./mocks.js";

    export * as shared from "./shared.js";
    export * as client from "./client.js";
  `;
}
