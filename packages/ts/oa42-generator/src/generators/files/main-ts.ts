import * as models from "../../models/index.js";
import { banner } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

/**
 * Main entrypoint for the package, exports client and server and
 * dependencies
 */
export function* generateMainTsCode(apiModel: models.Api) {
  yield banner;

  yield itt`
    export * from "oa42-lib";
    export * from "./types.js";
    export * from "./validators.js";
    export * from "./parsers.js";
    export * from "./parameters.js";
    export * from "./client.js";
    export * from "./server.js";
  `;
}
