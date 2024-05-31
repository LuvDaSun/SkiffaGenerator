import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getIsResponseParametersFunction,
  getParameterMemberName,
  getResponseParametersTypeName,
} from "../names/index.js";

export function* generateIsResponseParametersFunction(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
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
      ${generateBody(apiModelLegacy, operationResultModel)}
    }
  `;
}

function* generateBody(
  apiModelLegacy: models.Api,
  operationResultModel: core.OperationResultContainer,
) {
  const parameterModels = operationResultModel.headerParameters;

  for (const parameterModel of parameterModels) {
    const parameterSchemaId = parameterModel.schemaId;
    const parameterTypeName =
      parameterSchemaId == null
        ? parameterSchemaId
        : apiModelLegacy.names[parameterSchemaId.toString()];
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
