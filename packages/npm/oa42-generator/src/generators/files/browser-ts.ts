import * as oa42Core from "@oa42/core";
import { itt, packageInfo } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode() {
  yield oa42Core.banner("//", `v${packageInfo.version}`);

  yield itt`
    export * as lib from "oa42-lib";

    export * as types from "./types.js";
    export * as validators from "./validators.js";
    export * as parsers from "./parsers.js";
    export * as parameters from "./parameters.js";
    export * as mocks from "./mocks.js";

    export * as shared from "./shared.js";
    export * as client from "./client.js";
  `;
}
