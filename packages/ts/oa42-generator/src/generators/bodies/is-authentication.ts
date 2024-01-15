import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";

export function* generateIsAuthenticationFunctionBody(
  pathModel: models.Path,
  operationModel: models.Operation,
) {
  yield itt`
    // TODO
    return true;
  `;
}
