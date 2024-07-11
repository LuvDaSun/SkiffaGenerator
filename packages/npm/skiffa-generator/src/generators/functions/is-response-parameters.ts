import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import {
  getIsResponseParametersFunction,
  getParameterMemberName,
  getResponseParametersTypeName,
} from "../names.js";

export function* generateIsResponseParametersFunction(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  operationResultModel: skiffaCore.OperationResultContainer,
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
      ${generateBody(names, operationResultModel)}
    }
  `;
}

function* generateBody(
  names: Record<string, string>,
  operationResultModel: skiffaCore.OperationResultContainer,
) {
  const parameterModels = operationResultModel.headerParameters;

  for (const parameterModel of parameterModels) {
    const parameterSchemaId = parameterModel.schemaId;
    const parameterTypeName =
      parameterSchemaId == null ? parameterSchemaId : names[parameterSchemaId];
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
