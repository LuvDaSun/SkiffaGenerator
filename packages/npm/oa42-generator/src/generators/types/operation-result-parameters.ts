import * as core from "@oa42/core";
import camelcase from "camelcase";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationResultParameterTypes(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
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
          parameterSchemaId == null
            ? parameterSchemaId
            : apiModelLegacy.names[parameterSchemaId.toString()];

        return itt`
          ${camelcase(parameterModel.name)}${parameterModel.required ? "" : "?"}:
            ${parameterTypeName == null ? "unknown" : `types.${parameterTypeName}`}
        `;
      })}
    };
  `;
}
