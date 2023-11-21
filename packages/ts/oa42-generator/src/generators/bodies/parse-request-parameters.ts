import * as models from "../../models/index.js";
import { itt, toCamel, toPascal } from "../../utils/index.js";

export function* generateParseRequestParametersFunctionBody(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const requestParametersTypeName = toPascal(operationModel.name, "request", "parameters");

  yield itt`
    const result = {} as Partial<Record<keyof ${requestParametersTypeName}, unknown>>;
  `;

  const parameterModels = [
    ...operationModel.queryParameters,
    ...operationModel.headerParameters,
    ...operationModel.pathParameters,
    ...operationModel.cookieParameters,
  ];

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
