import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationAcceptType(operationModel: models.Operation) {
  const operationAcceptTypeName = toPascal(operationModel.name, "operation", "accept");

  yield itt`
    export type ${operationAcceptTypeName} = never;
  `;
}
