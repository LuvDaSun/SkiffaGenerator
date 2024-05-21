import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getIsRequestParametersFunction,
  getParameterMemberName,
  getRequestParametersTypeName,
} from "../names/index.js";

export function* generateIsRequestParametersFunction(
  apiModel: models.Api,
  operationModel: core.OperationContainer,
) {
  const isRequestParametersFunctionName = getIsRequestParametersFunction(operationModel);
  const requestParametersTypeName = getRequestParametersTypeName(operationModel);

  yield itt`
    export function ${isRequestParametersFunctionName}(
      parameters: Partial<Record<keyof ${requestParametersTypeName}, unknown>>,
    ): parameters is ${requestParametersTypeName} {
      ${generateBody(apiModel, operationModel)}
    }
  `;
}

function* generateBody(apiModel: models.Api, operationModel: core.OperationContainer) {
  const parameterModels = [
    ...operationModel.queryParameters,
    ...operationModel.headerParameters,
    ...operationModel.pathParameters,
    ...operationModel.cookieParameters,
  ];

  for (const parameterModel of parameterModels) {
    const parameterSchemaId = parameterModel.schemaId;
    const parameterTypeName =
      parameterSchemaId == null ? parameterSchemaId : apiModel.names[parameterSchemaId.toString()];
    if (parameterTypeName == null) {
      continue;
    }

    const isParameterFunction = `is${parameterTypeName}`;

    const parameterPropertyName = getParameterMemberName(parameterModel);

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
