import * as oa42Core from "@oa42/core";
import { toPascal } from "../../utils/index.js";

export function getServerAuthenticationTypeName() {
  return toPascal("server", "authentication");
}

export function getAuthenticationHandlerTypeName(
  authenticationModel: oa42Core.AuthenticationContainer,
) {
  return toPascal(authenticationModel.name, "authentication", "handler");
}

export function getOperationHandlerTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "operation", "handler");
}

export function getOperationHandlersTypeName() {
  return toPascal("operation", "handlers");
}

export function getOperationAuthenticationTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "authentication");
}

export function getAuthenticationHandlersTypeName() {
  return toPascal("authentication", "handlers");
}

export function getOperationAcceptTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "operation", "accept");
}

export function getCredentialsTypeName() {
  return toPascal("credentials");
}

export function getOperationCredentialsTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "credentials");
}

export function getAuthenticationCredentialTypeName(
  authenticationModel: oa42Core.AuthenticationContainer,
) {
  return toPascal(authenticationModel.name, "credential");
}

export function getIncomingRequestTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "incoming", "request");
}

export function getIncomingResponseTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "incoming", "response");
}

export function getOutgoingRequestTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "outgoing", "request");
}

export function getOutgoingResponseTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "outgoing", "response");
}

export function getRequestParametersTypeName(operationModel: oa42Core.OperationContainer) {
  return toPascal(operationModel.name, "request", "parameters");
}

export function getResponseParametersTypeName(
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
) {
  return toPascal(operationModel.name, operationResultModel.statusKind, "response", "parameters");
}
