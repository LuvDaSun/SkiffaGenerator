import * as skiffaCore from "@skiffa/core";
import camelcase from "camelcase";
import { itt } from "../../utils/iterable-text-template.js";
import { getRequestParametersTypeName } from "../names/index.js";

export function* generateOperationParametersTypes(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
) {
  const operationRequestParametersName = getRequestParametersTypeName(operationModel);

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
        const parameterTypeName = parameterSchemaId == null ? undefined : names[parameterSchemaId];

        return itt`
          ${camelcase(parameterModel.name)}${parameterModel.required ? "" : "?"}:
            ${parameterTypeName == null ? "unknown" : `types.${parameterTypeName}`}
        `;
      })}
    };
  `;
}
