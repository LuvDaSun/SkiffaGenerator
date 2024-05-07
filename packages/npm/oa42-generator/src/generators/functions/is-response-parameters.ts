import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getIsResponseParametersFunction,
  getParameterMemberName,
  getResponseParametersTypeName,
} from "../names/index.js";

export function* generateIsResponseParametersFunction(
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  const isResponseParametersFunctionName = getIsResponseParametersFunction(
    operationModel,
    operationResultModel,
  );
  const responseParametersTypeName = getResponseParametersTypeName(
    operationModel,
    operationResultModel,
  );

  yield itt`
    export function ${isResponseParametersFunctionName}(
      parameters: Partial<Record<keyof ${responseParametersTypeName}, unknown>>,
    ): parameters is ${responseParametersTypeName} {
      ${generateBody(apiModel, operationResultModel)}
    }
  `;
}

function* generateBody(apiModel: models.Api, operationResultModel: models.OperationResult) {
  const parameterModels = operationResultModel.headerParameters;

  for (const parameterModel of parameterModels) {
    const parameterSchemaId = parameterModel.schemaId;
    const parameterTypeName =
      parameterSchemaId == null ? parameterSchemaId : apiModel.names[parameterSchemaId];
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
