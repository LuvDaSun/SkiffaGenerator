import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toPascal } from "../../utils/name.js";

export function* generateOperationHandlerType(operationModel: models.Operation) {
  const operationHandlerTypeName = toPascal(operationModel.name, "operation", "handler");
  const operationAuthenticationName = toPascal(operationModel.name, "authentication");
  const operationAcceptTypeName = toPascal(operationModel.name, "operation", "accept");
  const operationIncomingRequestName = toPascal(operationModel.name, "incoming", "request");
  const operationOutgoingResponseName = toPascal(operationModel.name, "outgoing", "response");

  yield itt`
    export type ${operationHandlerTypeName}<A extends ServerAuthentication> = 
      (
        incomingRequest: ${operationIncomingRequestName},
        authentication: ${operationAuthenticationName}<A>,
        accepts: shared.${operationAcceptTypeName}[]
      ) => ${operationOutgoingResponseName} | Promise<${operationOutgoingResponseName}>
  `;
}
