import { banner } from "@oa42/core";
import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateClientOperationFunction } from "../functions/client-operation.js";
import {
  generateOperationCredentialsType,
  generateOperationIncomingResponseType,
  generateOperationOutgoingRequestType,
} from "../types/index.js";

export function* generateClientTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  yield itt`
    import { Router } from "goodrouter";
    import * as parameters from "./parameters.js";
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
    import * as shared from "./shared.js";
    import * as lib from "oa42-lib";
  `;

  yield itt`
    export interface ClientConfiguration {
      baseUrl?: URL;
      validateIncomingEntity?: boolean;
      validateIncomingParameters?: boolean;
      validateOutgoingEntity?: boolean;
      validateOutgoingParameters?: boolean;
    }

    export const defaultClientConfiguration = {
      validateIncomingEntity: true,
      validateIncomingParameters: true,
      validateOutgoingEntity: false,
      validateOutgoingParameters: false,
    };
  `;

  yield itt`
    const router = new Router({
      parameterValueDecoder: value => value,
      parameterValueEncoder: value => value,
    }).loadFromJson(${JSON.stringify(apiModel.router.saveToJson(RouterMode.Client))});
  `;

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateClientOperationFunction(apiModel, pathModel, operationModel);
      yield* generateOperationCredentialsType(apiModel, operationModel);
      yield* generateOperationOutgoingRequestType(apiModel, operationModel);
      yield* generateOperationIncomingResponseType(apiModel, operationModel);
    }
  }
}
