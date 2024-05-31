import * as core from "@oa42/core";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  generateIsRequestParametersFunction,
  generateIsResponseParametersFunction,
} from "../functions/index.js";
import {
  generateOperationParametersTypes,
  generateOperationResultParameterTypes,
} from "../types/index.js";

export function* generateParametersTsCode(
  names: Record<string, string>,
  apiModel: core.ApiContainer,
) {
  yield core.banner("//", `v${packageInfo.version}`);

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
      yield* generateIsRequestParametersFunction(names, operationModel);
      yield* generateOperationParametersTypes(names, operationModel);

      for (const operationResultModel of operationModel.operationResults) {
        yield* generateIsResponseParametersFunction(names, operationModel, operationResultModel);
        yield* generateOperationResultParameterTypes(names, operationModel, operationResultModel);
      }
    }
  }
}
