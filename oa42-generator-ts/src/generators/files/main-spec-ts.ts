import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateMainSpecTsCode(apiModel: models.Api) {
  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import main from "./main.js";
  `;
}
