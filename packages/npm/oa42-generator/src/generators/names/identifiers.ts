import * as oa42Core from "@oa42/core";
import { toCamel } from "../../utils/index.js";

export function getDefaultCredentialsConstantName() {
  return toCamel("default", "credentials");
}

export function getOperationFunctionName(operationModel: oa42Core.OperationContainer) {
  return toCamel(operationModel.name);
}

export function getOperationHandlerName(operationModel: oa42Core.OperationContainer) {
  return toCamel(operationModel.name);
}

export function getRegisterOperationHandlerName(operationModel: oa42Core.OperationContainer) {
  return toCamel("register", operationModel.name, "operation");
}

export function getRegisterOperationsHandlerName() {
  return toCamel("register", "operations");
}

export function getAuthenticationHandlerName(
  authenticationModel: oa42Core.AuthenticationContainer,
) {
  return toCamel(authenticationModel.name);
}

export function getRegisterAuthenticationHandlerName(
  authenticationModel: oa42Core.AuthenticationContainer,
) {
  return toCamel("register", authenticationModel.name, "authentication");
}

export function getRegisterAuthenticationsHandlerName() {
  return toCamel("register", "authentications");
}

export function getEndpointHandlerName(operationModel: oa42Core.OperationContainer) {
  return toCamel(operationModel.name, "endpoint", "handler");
}

export function getOperationAcceptConstName(operationModel: oa42Core.OperationContainer) {
  return toCamel(operationModel.name, "operation", "accept");
}

export function getAuthenticationMemberName(authenticationModel: oa42Core.AuthenticationContainer) {
  return toCamel(authenticationModel.name);
}

export function getParameterMemberName(parameterModel: oa42Core.ParameterContainer) {
  return toCamel(parameterModel.name);
}

export function getIsRequestParametersFunction(operationModel: oa42Core.OperationContainer) {
  return toCamel("is", operationModel.name, "request", "parameters");
}

export function getIsResponseParametersFunction(
  operationModel: oa42Core.OperationContainer,
  operationResultModel: oa42Core.OperationResultContainer,
) {
  return toCamel(
    "is",
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );
}

export function getIsOperationAuthenticationName(operationModel: oa42Core.OperationContainer) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getIsAuthenticationFunctionName(operationModel: oa42Core.OperationContainer) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getParseParameterFunction(
  names: Record<string, string>,
  parameterModel: oa42Core.ParameterContainer,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("parse", parameterTypeName);
}

export function getMockParameterFunction(
  names: Record<string, string>,
  parameterModel: oa42Core.ParameterContainer,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("mock", parameterTypeName);
}

export function getIsParameterFunction(
  names: Record<string, string>,
  parameterModel: oa42Core.ParameterContainer,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("is", parameterTypeName);
}

export function getMockBodyFunction(
  names: Record<string, string>,
  bodyModel: oa42Core.BodyContainer,
) {
  const bodySchemaId = bodyModel.schemaId?.toString();
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("mock", bodyTypeName);
}

export function getIsBodyFunction(
  names: Record<string, string>,
  bodyModel: oa42Core.BodyContainer,
) {
  const bodySchemaId = bodyModel.schemaId?.toString();
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("is", bodyTypeName);
}
