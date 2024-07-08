import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/index.js";
import { selectBodies } from "../helpers.js";
import { getOperationAcceptTypeName } from "../names/index.js";

export function* generateOperationAcceptType(
  operationModel: skiffaCore.OperationContainer,
  responseTypes: Array<string>,
) {
  const operationAcceptTypeName = getOperationAcceptTypeName(operationModel);

  const operationAccepts = [
    ...new Set(
      operationModel.operationResults.flatMap((operationResultModel) =>
        selectBodies(operationResultModel, responseTypes).map((bodyModel) => bodyModel.contentType),
      ),
    ),
  ];

  yield itt`
    export type ${operationAcceptTypeName} = ${
      operationAccepts.length > 0
        ? operationAccepts.map((operationAccept) => JSON.stringify(operationAccept)).join(" | ")
        : "never"
    };
  `;
}
