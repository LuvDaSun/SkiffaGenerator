import * as oa42Core from "@oa42/core";
import camelcase from "camelcase";
import { itt } from "../../utils/iterable-text-template.js";
import { getResponseParametersTypeName } from "../names/index.js";

export function* generateOperationResultParameterTypes(
  names: Record<string, string>,
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
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
          parameterSchemaId == null ? parameterSchemaId : names[parameterSchemaId];

        return itt`
          ${camelcase(parameterModel.name)}${parameterModel.required ? "" : "?"}:
            ${parameterTypeName == null ? "unknown" : `types.${parameterTypeName}`}
        `;
      })}
    };
  `;
}
