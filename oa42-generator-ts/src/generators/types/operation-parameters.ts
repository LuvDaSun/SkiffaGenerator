import camelcase from "camelcase";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationParametersTypes(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationRequestParametersName = toPascal(
    operationModel.name,
    "request",
    "parameters",
  );

  const parameterModels = [
    ...operationModel.queryParameters,
    ...operationModel.headerParameters,
    ...operationModel.pathParameters,
    ...operationModel.cookieParameters,
  ];

  yield itt`
    export type ${operationRequestParametersName} = {
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
