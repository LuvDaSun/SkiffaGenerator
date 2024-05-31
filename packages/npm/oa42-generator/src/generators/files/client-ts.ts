import * as core from "@oa42/core";
import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateClientOperationFunction } from "../functions/client-operation.js";
import {
  generateAuthenticationCredentialType,
  generateCredentialsType,
  generateOperationCredentialsType,
  generateOperationIncomingResponseType,
  generateOperationOutgoingRequestType,
} from "../types/index.js";
import { generateCredentialsConstant } from "../variables/default-credentials.js";

export function* generateClientTsCode(apiModelLegacy: models.Api, apiModel: core.ApiContainer) {
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
    }).loadFromJson(${JSON.stringify(apiModelLegacy.router.saveToJson(RouterMode.Client))});
  `;

  yield* generateCredentialsConstant();
  yield* generateCredentialsType(apiModelLegacy);

  for (const authenticationModel of apiModelLegacy.authentication) {
    yield* generateAuthenticationCredentialType(authenticationModel);
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateClientOperationFunction(apiModelLegacy, pathModel, operationModel);
    }
  }

  for (const pathModel of apiModelLegacy.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateOperationCredentialsType(apiModelLegacy, operationModel);
      yield* generateOperationOutgoingRequestType(apiModelLegacy, operationModel);
      yield* generateOperationIncomingResponseType(apiModelLegacy, operationModel);
    }
  }
}
