import * as core from "@oa42/core";
import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateServerClass } from "../classes/index.js";
import { generateIsAuthenticationFunction } from "../functions/is-authentication.js";
import {
  generateAuthenticationHandlerType,
  generateAuthenticationHandlersType,
  generateOperationAuthenticationType,
  generateOperationHandlerType,
  generateOperationHandlersType,
  generateOperationIncomingRequestType,
  generateOperationOutgoingResponseType,
  generateServerAuthenticationType,
} from "../types/index.js";

export function* generateServerTsCode(apiModelLegacy: models.Api, apiModel: core.ApiContainer) {
  yield core.banner("//", `v${packageInfo.version}`);

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
    export interface ServerConfiguration {
      validateIncomingEntity: boolean;
      validateIncomingParameters: boolean;
      validateOutgoingEntity: boolean;
      validateOutgoingParameters: boolean;
    }
    export const defaultServerConfiguration: ServerConfiguration = {
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
    }).loadFromJson(${JSON.stringify(apiModelLegacy.router.saveToJson(RouterMode.Bidirectional))});
  `;

  yield* generateServerAuthenticationType(apiModelLegacy);
  yield* generateAuthenticationHandlersType(apiModelLegacy);
  yield* generateOperationHandlersType(apiModel);
  yield* generateServerClass(apiModelLegacy, apiModel);

  for (const authenticationModel of apiModelLegacy.authentication) {
    yield* generateAuthenticationHandlerType(authenticationModel);
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateOperationHandlerType(operationModel);

      yield* generateIsAuthenticationFunction(apiModelLegacy, operationModel);
      yield* generateOperationAuthenticationType(apiModelLegacy, operationModel);

      yield* generateOperationIncomingRequestType(apiModelLegacy, operationModel);
      yield* generateOperationOutgoingResponseType(apiModelLegacy, operationModel);
    }
  }
}
