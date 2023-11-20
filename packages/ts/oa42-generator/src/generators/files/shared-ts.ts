import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateIsRequestParametersFunctionBody } from "../bodies/index.js";
import { generateIsResponseParametersFunctionBody } from "../bodies/is-response-parameters.js";
import {
  generateOperationParametersTypes,
  generateOperationResultParameterTypes,
} from "../types/index.js";

export function* getSharedTsCode(apiModel: models.Api) {
  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
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
