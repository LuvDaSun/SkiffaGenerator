import * as models from "../../models/index.js";
import { toCamel } from "../../utils/index.js";

export function getOperationHandlerName(operationModel: models.Operation) {
  return toCamel(operationModel.name, "operation", "handler");
}
