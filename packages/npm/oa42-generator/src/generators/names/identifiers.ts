import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { toCamel } from "../../utils/index.js";

export function getDefaultCredentialsConstantName() {
  return toCamel("default", "credentials");
}

export function getOperationFunctionName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel(operationModel.name);
}

export function getOperationHandlerName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel(operationModel.name);
}

export function getRegisterOperationHandlerName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel("register", operationModel.name, "operation");
}

export function getRegisterOperationsHandlerName() {
  return toCamel("register", "operations");
}

export function getAuthenticationHandlerName(authenticationModel: models.Authentication) {
  return toCamel(authenticationModel.name);
}

export function getRegisterAuthenticationHandlerName(authenticationModel: models.Authentication) {
  return toCamel("register", authenticationModel.name, "authentication");
}

export function getRegisterAuthenticationsHandlerName() {
  return toCamel("register", "authentications");
}

export function getEndpointHandlerName(operationModel: core.OperationContainer | models.Operation) {
  return toCamel(operationModel.name, "endpoint", "handler");
}

export function getOperationAcceptConstName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel(operationModel.name, "operation", "accept");
}

export function getAuthenticationMemberName(authenticationModel: models.Authentication) {
  return toCamel(authenticationModel.name);
}

export function getParameterMemberName(parameterModel: core.ParameterContainer | models.Parameter) {
  return toCamel(parameterModel.name);
}

export function getIsRequestParametersFunction(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel("is", operationModel.name, "request", "parameters");
}

export function getIsResponseParametersFunction(
  operationModel: core.OperationContainer | models.Operation,
  operationResultModel: core.OperationResultContainer | models.OperationResult,
) {
  return toCamel(
    "is",
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );
}

export function getIsOperationAuthenticationName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getIsAuthenticationFunctionName(
  operationModel: core.OperationContainer | models.Operation,
) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getParseParameterFunction(
  apiModelLegacy: models.Api,
  parameterModel: core.ParameterContainer | models.Parameter,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModelLegacy.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("parse", parameterTypeName);
}

export function getMockParameterFunction(
  apiModelLegacy: models.Api,
  parameterModel: core.ParameterContainer,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModelLegacy.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("mock", parameterTypeName);
}

export function getIsParameterFunction(
  apiModelLegacy: models.Api,
  parameterModel: core.ParameterContainer,
) {
  const parameterSchemaId = parameterModel.schemaId?.toString();
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModelLegacy.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("is", parameterTypeName);
}

export function getMockBodyFunction(apiModelLegacy: models.Api, bodyModel: core.BodyContainer) {
  const bodySchemaId = bodyModel.schemaId?.toString();
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = apiModelLegacy.names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("mock", bodyTypeName);
}

export function getIsBodyFunction(apiModelLegacy: models.Api, bodyModel: core.BodyContainer) {
  const bodySchemaId = bodyModel.schemaId?.toString();
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = apiModelLegacy.names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("is", bodyTypeName);
}
