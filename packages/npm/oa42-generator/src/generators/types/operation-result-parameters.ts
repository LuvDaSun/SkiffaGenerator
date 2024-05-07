import camelcase from "camelcase";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationResultParameterTypes(
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  const operationResponseParametersName = getResponseParametersTypeName(
    operationModel,
    operationResultModel,
  );

  const parameterModels = operationResultModel.headerParameters;

  yield itt`
    export type ${operationResponseParametersName} = {
      ${parameterModels.map((parameterModel) => {
        const parameterSchemaId = parameterModel.schemaId;
        const parameterTypeName =
          parameterSchemaId == null ? parameterSchemaId : apiModel.names[parameterSchemaId];

        return itt`
          ${camelcase(parameterModel.name)}${parameterModel.required ? "" : "?"}:
            ${parameterTypeName == null ? "unknown" : `types.${parameterTypeName}`}
        `;
      })}
    };
  `;
}
