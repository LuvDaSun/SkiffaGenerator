import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";

/**
 * Main entrypoint for the package, exports client and server and
 * dependencies
 */
export function* generateMainTsCode(apiModel: models.Api) {
  yield itt`
    export * from "@oa42/oa42-lib";
    export * from "./shared.js";
    export * from "./client.js";
    export * from "./server.js";
  `;
}
