import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getIncomingRequestTypeName,
  getOperationAcceptTypeName,
  getOperationAuthenticationTypeName,
  getOperationHandlerTypeName,
  getOutgoingResponseTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateOperationHandlerType(operationModel: models.Operation) {
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
