import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateIsAuthenticationFunctionBody(
  pathModel: models.Path,
  operationModel: models.Operation,
) {
  yield itt`
    throw new Error("TODO");
  `;
}
