import * as models from "../../models/index.js";
import { banner, itt } from "../../utils/index.js";

/**
 * Code generator that generates code only for browsers
 */
export function* generateBrowserTsCode(apiModel: models.Api) {
  yield banner;

  yield itt`
    export * from "./types.js";
    export * from "./validators.js";
    export * from "./parsers.js";
    export * from "./parameters.js";
    export * from "./client.js";
  `;
}
