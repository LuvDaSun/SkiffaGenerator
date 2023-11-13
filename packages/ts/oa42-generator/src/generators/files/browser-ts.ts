import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode(apiModel: models.Api) {
  yield itt`
    export * from "./shared.js";
    export * from "./client.js";
  `;
}
