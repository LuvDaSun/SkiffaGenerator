import * as models from "../../models/index.js";
import { itt, toCamel, toPascal } from "../../utils/index.js";

export function* generateIsRequestParametersFunction(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const isRequestParametersFunctionName = toCamel(
    "is",
    operationModel.name,
    "request",
    "parameters",
  );

  const requestParametersTypeName = toPascal(operationModel.name, "request", "parameters");

  yield itt`
    export function ${isRequestParametersFunctionName}(
      parameters: Partial<Record<keyof ${requestParametersTypeName}, unknown>>,
    ): parameters is ${requestParametersTypeName} {
      ${generateBody(apiModel, operationModel)}
    }
  `;
}

function* generateBody(apiModel: models.Api, operationModel: models.Operation) {
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

    const isParameterFunction = `is${parameterTypeName}`;

    const parameterPropertyName = toCamel(parameterModel.name);

    if (parameterModel.required) {
      yield itt`
        if(parameters.${parameterPropertyName} === undefined) {
          recordError(
            ${JSON.stringify(parameterPropertyName)},
            "",
            "required"
          );
          return false;
        }
        if(!validators.${isParameterFunction}(
          parameters.${parameterPropertyName}
        )) {
          const lastValidationError = validators.getLastValidationError();
          recordError(
            ${JSON.stringify(parameterPropertyName)},
            lastValidationError.path,
            lastValidationError.rule,
            lastValidationError.typeName,
          );
          return false;
        }
      `;
    } else {
      yield itt`
        if(parameters.${parameterPropertyName} !== undefined && !validators.${isParameterFunction}(
          parameters.${parameterPropertyName}
        )) {
          const lastValidationError = validators.getLastValidationError();
          recordError(
            ${JSON.stringify(parameterPropertyName)},
            lastValidationError.path,
            lastValidationError.rule,
            lastValidationError.typeName,
          );
          return false;
        }
      `;
    }
  }

  yield itt`
    return true;
  `;
}
