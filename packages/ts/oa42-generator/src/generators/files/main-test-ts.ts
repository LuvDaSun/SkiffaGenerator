import * as models from "../../models/index.js";
import { banner } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateMainTestTsCode(apiModel: models.Api) {
  yield banner;

  yield itt`
    import assert from "assert/strict";
    import test from "node:test";
    import * as main from "./main.js";
  `;
}
