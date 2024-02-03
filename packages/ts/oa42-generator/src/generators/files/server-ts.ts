import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { banner, toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateIsAuthenticationFunctionBody } from "../bodies/index.js";
import {
  generateOperationAuthenticationType,
  generateOperationHandlerType,
  generateOperationIncomingRequestType,
  generateOperationOutgoingResponseType,
  generateServerAuthenticationType,
  generateServerClass,
} from "../types/index.js";

export function* generateServerTsCode(apiModel: models.Api) {
  yield banner;

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
      validateIncomingEntity?: boolean;
      validateIncomingParameters?: boolean;
      validateOutgoingEntity?: boolean;
      validateOutgoingParameters?: boolean;
    }
    export const defaultServerConfiguration = {
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
    const handlerTypeName = toPascal(authenticationModel.name, "authentication", "handler");

    switch (authenticationModel.type) {
      case "apiKey":
        yield itt`
          export type ${handlerTypeName}<A extends ServerAuthentication> =
            (credential: string) =>
              A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined |
              Promise<A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined>;
          `;
        break;

      case "http":
        switch (authenticationModel.scheme) {
          case "basic":
            yield itt`
              export type ${handlerTypeName}<A extends ServerAuthentication> =
                (credential: {
                  id: string,
                  secret: string,
                }) =>
                  A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined |
                  Promise<A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined>;
              `;
            break;

          case "bearer":
            yield itt`
              export type ${handlerTypeName}<A extends ServerAuthentication> =
                (credential: string) =>
                  A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined |
                  Promise<A[${JSON.stringify(toCamel(authenticationModel.name))}] | undefined>;
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
      const isAuthenticationFunctionName = toCamel("is", operationModel.name, "authentication");
      const authenticationTypeName = toPascal(operationModel.name, "authentication");

      yield itt`
        export function ${isAuthenticationFunctionName}<A extends ServerAuthentication>(
          authentication: Partial<${authenticationTypeName}<A>>,
        ): authentication is ${authenticationTypeName}<A> {
          ${generateIsAuthenticationFunctionBody(pathModel, operationModel)}
        }
      `;

      yield* generateOperationAuthenticationType(operationModel);
      yield* generateOperationHandlerType(operationModel);

      yield* generateOperationIncomingRequestType(apiModel, operationModel);
      yield* generateOperationOutgoingResponseType(apiModel, operationModel);
    }
  }
}
