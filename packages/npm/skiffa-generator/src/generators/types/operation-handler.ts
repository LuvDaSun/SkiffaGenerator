import * as skiffaCore from "@skiffa/core";
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
} from "../names.js";

export function* generateOperationHandlerType(operationModel: skiffaCore.OperationContainer) {
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

export function* generateOperationHandlersType(apiModel: skiffaCore.ApiContainer) {
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const typeName = getOperationHandlersTypeName();

  yield itt`
    export type ${typeName}<A extends ${serverAuthenticationName}> = {
      ${body()}
    }
  `;

  function* body() {
    for (const pathModel of apiModel.paths) {
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
