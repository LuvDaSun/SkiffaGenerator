import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getIncomingRequestTypeName,
  getOperationAcceptTypeName,
  getOperationAuthenticationTypeName,
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getOperationHandlersTypeName,
  getOutgoingResponseTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateOperationHandlerType(operationModel: core.OperationContainer) {
  const operationHandlerTypeName = getOperationHandlerTypeName(operationModel);
  const operationAuthenticationName = getOperationAuthenticationTypeName(operationModel);
  const operationAcceptTypeName = getOperationAcceptTypeName(operationModel);
  const operationIncomingRequestName = getIncomingRequestTypeName(operationModel);
  const operationOutgoingResponseName = getOutgoingResponseTypeName(operationModel);
  const serverAuthenticationName = getServerAuthenticationTypeName();

  yield itt`
    export type ${operationHandlerTypeName}<A extends ${serverAuthenticationName}> = 
      (
        incomingRequest: ${operationIncomingRequestName},
        authentication: ${operationAuthenticationName}<A>,
        accepts: shared.${operationAcceptTypeName}[]
      ) => Promise<${operationOutgoingResponseName}>
  `;
}

export function* generateOperationHandlersType(apiModelLegacy: models.Api) {
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const typeName = getOperationHandlersTypeName();

  yield itt`
    export type ${typeName}<A extends ${serverAuthenticationName}> = {
      ${body()}
    }
  `;

  function* body() {
    for (const pathModel of apiModelLegacy.paths) {
      for (const operationModel of pathModel.operations) {
        const propertyName = getOperationHandlerName(operationModel);
        const typeName = getOperationHandlerTypeName(operationModel);
        yield `
          ${propertyName}: ${typeName}<A>,
        `;
      }
    }
  }
}
