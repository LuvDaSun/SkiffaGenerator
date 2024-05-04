import * as models from "../../models/index.js";
import { toPascal } from "../../utils/index.js";

export function getServerAuthenticationTypeName() {
  return "ServerAuthentication";
}

export function getAuthenticationHandlerTypeName(authenticationModel: models.Authentication) {
  return toPascal(authenticationModel.name, "authentication", "handler");
}

export function getOperationHandlerTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "operation", "handler");
}

export function getOperationAuthenticationTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "authentication");
}

export function getOperationAcceptTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "operation", "accept");
}

export function getOperationCredentialsTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "credentials");
}

export function getIncomingRequestTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "incoming", "request");
}

export function getIncomingResponseTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "incoming", "response");
}

export function getOutgoingRequestTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "outgoing", "request");
}

export function getOutgoingResponseTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "outgoing", "response");
}

export function getRequestParametersTypeName(operationModel: models.Operation) {
  return toPascal(operationModel.name, "request", "parameters");
}

export function getResponseParametersTypeName(
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  return toPascal(operationModel.name, operationResultModel.statusKind, "response", "parameters");
}
