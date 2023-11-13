import { RouterMode } from "goodrouter";
import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateClientOperationFunctionBody } from "../bodies/index.js";
import {
  generateOperationIncomingResponseType,
  generateOperationOutgoingRequestType,
} from "../types/index.js";

export function* generateClientTsCode(apiModel: models.Api) {
  yield itt`
    import { Router } from "goodrouter";
    import * as shared from "./shared.js";
    import * as lib from "oa42-lib";
  `;

  yield itt`
    export interface ClientOptions {
      baseUrl?: URL;
      validateIncomingEntity?: boolean;
      validateIncomingParameters?: boolean;
      validateOutgoingEntity?: boolean;
      validateOutgoingParameters?: boolean;
    }

    export const defaultClientOptions = {
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
      const operationFunctionName = toCamel(operationModel.name);

      const operationOutgoingRequestName = toPascal(operationModel.name, "outgoing", "request");

      const operationIncomingResponseName = toPascal(operationModel.name, "incoming", "response");

      yield itt`
        export async function ${operationFunctionName}(
          outgoingRequest: ${operationOutgoingRequestName},
          credentials: unknown,
          options: ClientOptions = defaultClientOptions,
        ): Promise<${operationIncomingResponseName}> {
          ${generateClientOperationFunctionBody(apiModel, pathModel, operationModel)}
        }
      `;
      yield* generateOperationOutgoingRequestType(apiModel, operationModel);
      yield* generateOperationIncomingResponseType(apiModel, operationModel);
    }
  }
}
