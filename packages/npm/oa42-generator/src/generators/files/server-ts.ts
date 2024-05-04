import { banner } from "@oa42/core";
import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateServerClass } from "../classes/index.js";
import { generateIsAuthenticationFunction } from "../functions/is-authentication.js";
import {
  getAuthenticationHandlerTypeName,
  getAuthenticationMemberName,
  getServerAuthenticationTypeName,
} from "../names/index.js";
import {
  generateOperationAuthenticationType,
  generateOperationHandlerType,
  generateOperationIncomingRequestType,
  generateOperationOutgoingResponseType,
  generateServerAuthenticationType,
} from "../types/index.js";

export function* generateServerTsCode(apiModel: models.Api) {
  const serverAuthenticationName = getServerAuthenticationTypeName();

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
    }).loadFromJson(${JSON.stringify(apiModel.router.saveToJson(RouterMode.Bidirectional))});
  `;

  yield* generateServerAuthenticationType(apiModel);
  yield* generateServerClass(apiModel);

  for (const authenticationModel of apiModel.authentication) {
    const handlerTypeName = getAuthenticationHandlerTypeName(authenticationModel);

    switch (authenticationModel.type) {
      case "apiKey":
        yield itt`
          export type ${handlerTypeName}<A extends ${serverAuthenticationName}> =
            (credential: string) =>
              Promise<A[${JSON.stringify(getAuthenticationMemberName(authenticationModel))}] | undefined>;
          `;
        break;

      case "http":
        switch (authenticationModel.scheme) {
          case "basic":
            yield itt`
              export type ${handlerTypeName}<A extends ${serverAuthenticationName}> =
                (credential: {
                  id: string,
                  secret: string,
                }) =>
                  Promise<A[${JSON.stringify(getAuthenticationMemberName(authenticationModel))}] | undefined>;
              `;
            break;

          case "bearer":
            yield itt`
              export type ${handlerTypeName}<A extends ${serverAuthenticationName}> =
                (credential: string) =>
                  Promise<A[${JSON.stringify(getAuthenticationMemberName(authenticationModel))}] | undefined>;
              `;
            break;

          default: {
            throw "impossible";
          }
        }
        break;

      default: {
        throw "impossible";
      }
    }
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateIsAuthenticationFunction(pathModel, operationModel);

      yield* generateOperationAuthenticationType(operationModel);
      yield* generateOperationHandlerType(operationModel);

      yield* generateOperationIncomingRequestType(apiModel, operationModel);
      yield* generateOperationOutgoingResponseType(apiModel, operationModel);
    }
  }
}
