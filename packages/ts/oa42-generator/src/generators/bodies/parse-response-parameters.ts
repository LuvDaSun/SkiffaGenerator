import * as models from "../../models/index.js";
import { itt, toCamel, toPascal } from "../../utils/index.js";

export function* generateParseResponseParametersFunctionBody(
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  const responseParametersTypeName = toPascal(
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  yield itt`
    const result = {} as Partial<Record<keyof ${responseParametersTypeName}, unknown>>;
  `;

  const parameterModels = operationResultModel.headerParameters;

  for (const parameterModel of parameterModels) {
    const parameterSchemaId = parameterModel.schemaId;
    const parameterTypeName =
      parameterSchemaId == null ? parameterSchemaId : apiModel.names[parameterSchemaId];
    if (parameterTypeName == null) {
      continue;
    }

    const parseParameterFunction = `parse${parameterTypeName}`;
    const parameterPropertyName = toCamel(parameterModel.name);

    yield itt`
      result[${JSON.stringify(
        parameterPropertyName,
      )}] = ${parseParameterFunction}(parameters[${JSON.stringify(parameterPropertyName)}]);
    `;
  }

  yield itt`
    return result;
  `;
}
