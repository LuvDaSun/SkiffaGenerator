import * as models from "../../models/index.js";
import { banner, toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  generateIsRequestParametersFunctionBody,
  generateIsResponseParametersFunctionBody,
} from "../bodies/index.js";
import { GeneratorConfiguration } from "../configuration.js";
import {
  generateOperationParametersTypes,
  generateOperationResultParameterTypes,
} from "../types/index.js";

export function* generateParametersTsCode(
  apiModel: models.Api,
  configuration: GeneratorConfiguration,
) {
  yield banner;

  yield itt`
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
  `;

  yield itt`
    export interface ParameterValidationError {
      parameterName: string;
      path: string;
      rule: string;
      typeName?: string;
    }

    let lastParameterValidationError: ParameterValidationError | undefined;
    export function getLastParameterValidationError() {
      if(lastParameterValidationError == null) {
        throw new TypeError("no validation errors");
      }
      return lastParameterValidationError;
    }

    function recordError(
      parameterName: string,
      path: string,
      rule: string,
      typeName?: string
    ) {
      lastParameterValidationError = {
        parameterName,
        path,
        rule,
        typeName,
      }
    }
  `;

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      const isRequestParametersFunctionName = toCamel(
        "is",
        operationModel.name,
        "request",
        "parameters",
      );

      const parseRequestParametersFunctionName = toCamel(
        "parse",
        operationModel.name,
        "request",
        "parameters",
      );

      const requestParametersTypeName = toPascal(operationModel.name, "request", "parameters");

      yield itt`
        export function ${isRequestParametersFunctionName}(
          parameters: Partial<Record<keyof ${requestParametersTypeName}, unknown>>,
        ): parameters is ${requestParametersTypeName} {
          ${generateIsRequestParametersFunctionBody(apiModel, operationModel)}
        }
      `;

      yield* generateOperationParametersTypes(apiModel, operationModel);

      for (const operationResultModel of operationModel.operationResults) {
        const isResponseParametersFunctionName = toCamel(
          "is",
          operationModel.name,
          operationResultModel.statusKind,
          "response",
          "parameters",
        );

        const parseResponseParametersFunctionName = toCamel(
          "parse",
          operationModel.name,
          operationResultModel.statusKind,
          "response",
          "parameters",
        );

        const responseParametersTypeName = toPascal(
          operationModel.name,
          operationResultModel.statusKind,
          "response",
          "parameters",
        );

        yield itt`
          export function ${isResponseParametersFunctionName}(
            parameters: Partial<Record<keyof ${responseParametersTypeName}, unknown>>,
          ): parameters is ${responseParametersTypeName} {
            ${generateIsResponseParametersFunctionBody(apiModel, operationResultModel)}
          }
        `;

        yield* generateOperationResultParameterTypes(
          apiModel,
          operationModel,
          operationResultModel,
        );
      }
    }
  }
}
