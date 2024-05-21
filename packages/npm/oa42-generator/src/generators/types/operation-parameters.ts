import * as core from "@oa42/core";
import camelcase from "camelcase";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getRequestParametersTypeName } from "../names/index.js";

export function* generateOperationParametersTypes(
  apiModel: models.Api,
  operationModel: core.OperationContainer,
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
        const parameterTypeName =
          parameterSchemaId == null ? undefined : apiModel.names[parameterSchemaId.toString()];

        return itt`
          ${camelcase(parameterModel.name)}${parameterModel.required ? "" : "?"}:
            ${parameterTypeName == null ? "unknown" : `types.${parameterTypeName}`}
        `;
      })}
    };
  `;
}
