import * as skiffaCore from "@skiffa/core";
import { Router, RouterMode } from "goodrouter";
import { packageInfo } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateClientOperationFunction } from "../functions/client-operation.js";
import {
  generateAuthenticationCredentialType,
  generateCredentialsType,
  generateOperationCredentialsType,
  generateOperationIncomingResponseType,
  generateOperationOutgoingRequestType,
} from "../types.js";

export function* generateClientTsCode(
  names: Record<string, string>,
  router: Router<number>,
  apiModel: skiffaCore.ApiContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import { Router } from "goodrouter";
    import * as parameters from "./parameters.js";
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
    import * as shared from "./shared.js";
    import * as lib from "@skiffa/lib";
  `;

  yield itt`
    export interface ClientConfiguration {
      baseUrl?: URL;
      validateIncomingEntity?: boolean;
      validateIncomingParameters?: boolean;
      validateOutgoingEntity?: boolean;
      validateOutgoingParameters?: boolean;
    }
  `;

  yield itt`
    const router = new Router({
      parameterValueDecoder: value => value,
      parameterValueEncoder: value => value,
    }).loadFromJson(${JSON.stringify(router.saveToJson(RouterMode.Client))});
  `;

  yield* generateCredentialsType(apiModel);

  for (const authenticationModel of apiModel.authentication) {
    yield* generateAuthenticationCredentialType(authenticationModel);
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateClientOperationFunction(
        names,
        apiModel,
        pathModel,
        operationModel,
        requestTypes,
        responseTypes,
      );
      yield* generateOperationCredentialsType(apiModel, operationModel);
      yield* generateOperationOutgoingRequestType(names, operationModel, requestTypes);
      yield* generateOperationIncomingResponseType(names, operationModel, responseTypes);
    }
  }
}
