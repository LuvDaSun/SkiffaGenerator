import * as skiffaCore from "@skiffa/core";
import { Router } from "goodrouter";
import { packageInfo } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateClientOperationFunction } from "../functions.js";
import { getAuthenticationCredentialTypeName, getAuthenticationMemberName } from "../names.js";
import {
  generateAuthenticationCredentialType,
  generateOperationCredentialsType,
} from "../types.js";

export function* generateClientTsCode(
  names: Record<string, string>,
  router: Router<number>,
  apiModel: skiffaCore.ApiContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
  baseUrl: URL | undefined,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import * as lib from "@skiffa/lib";
    import * as $parameters from "./parameters.js";
    import * as types from "./types.js";
    import * as validators from "./validators.js";
    import * as parsers from "./parsers.js";
    import * as accept from "./accept.js";
    import { router } from "./router.js";
  `;

  yield itt`
    export const defaultClientConfiguration: ClientConfiguration = {
      baseUrl: ${baseUrl == null ? "undefined" : JSON.stringify(baseUrl.toString())},
      validateIncomingEntity: true,
      validateIncomingParameters: true,
      validateOutgoingEntity: false,
      validateOutgoingParameters: false,
    };
  `;
  yield itt`
  export interface ClientConfiguration {
    baseUrl?: URL;
    validateIncomingEntity?: boolean;
    validateIncomingParameters?: boolean;
    validateOutgoingEntity?: boolean;
    validateOutgoingParameters?: boolean;
    ${generateCredentialFields()}
  }
`;

  function* generateCredentialFields() {
    for (const authenticationModel of apiModel.authentication) {
      const memberName = getAuthenticationMemberName(authenticationModel);
      const typeName = getAuthenticationCredentialTypeName(authenticationModel);

      yield `
      ${memberName}?: ${typeName};
    `;
    }
  }
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
    }
  }
}
