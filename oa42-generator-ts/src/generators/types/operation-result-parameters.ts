import camelcase from "camelcase";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationResultParameterTypes(
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  const operationResponseParametersName = toPascal(
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  const parameterModels = operationResultModel.headerParameters;

  yield itt`
    export type ${operationResponseParametersName} = {
      ${parameterModels.map((parameterModel) => {
        const parameterSchemaId = parameterModel.schemaId;
        const parameterTypeName =
          parameterSchemaId == null
            ? parameterSchemaId
            : apiModel.names[parameterSchemaId];

        return itt`
          ${camelcase(parameterModel.name)}${
            parameterModel.required ? "?" : ""
          }:
            ${parameterTypeName == null ? "unknown" : parameterTypeName}
        `;
      })}
    };
  `;
}
