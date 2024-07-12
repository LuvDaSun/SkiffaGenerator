import * as skiffaCore from "@skiffa/core";
import { Router } from "goodrouter";
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
    import * as lib from "@skiffa/lib";
    import * as parameters from "./parameters.js";
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
    import * as shared from "./shared.js";
    import { router } as lib from "./router.js";
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
