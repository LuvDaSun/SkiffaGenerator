import * as skiffaCore from "@skiffa/core";
import { Router } from "goodrouter";
import { packageInfo } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateServerClass } from "../classes.js";
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
} from "../types.js";

export function* generateServerTsCode(
  names: Record<string, string>,
  router: Router<number>,
  apiModel: skiffaCore.ApiContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import * as parameters from "./parameters.js";
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
    import * as accept from "./accept.js";
    import * as lib from "@skiffa/lib";
    import { router } from "./router.js";
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

  yield* generateServerAuthenticationType(apiModel);
  yield* generateAuthenticationHandlersType(apiModel);
  yield* generateOperationHandlersType(apiModel);
  yield* generateServerClass(names, apiModel, requestTypes, responseTypes);

  for (const authenticationModel of apiModel.authentication) {
    yield* generateAuthenticationHandlerType(authenticationModel);
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateOperationHandlerType(operationModel);

      yield* generateIsAuthenticationFunction(apiModel, operationModel);
      yield* generateOperationAuthenticationType(apiModel, operationModel);

      yield* generateOperationIncomingRequestType(names, operationModel, requestTypes);
      yield* generateOperationOutgoingResponseType(names, operationModel, responseTypes);
    }
  }
}
