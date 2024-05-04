import * as models from "../../models/index.js";
import { toCamel } from "../../utils/index.js";

export function getOperationFunctionName(operationModel: models.Operation) {
  return toCamel(operationModel.name);
}

export function getOperationHandlerName(operationModel: models.Operation) {
  return toCamel(operationModel.name, "operation", "handler");
}

export function getRegisterOperationHandlerName(operationModel: models.Operation) {
  return toCamel("register", operationModel.name, "operation");
}

export function getAuthenticationHandlerName(authenticationModel: models.Authentication) {
  return toCamel(authenticationModel.name, "authentication", "handler");
}

export function getRegisterAuthenticationHandlerName(authenticationModel: models.Authentication) {
  return toCamel("register", authenticationModel.name, "authentication");
}

export function getEndpointHandlerName(operationModel: models.Operation) {
  return toCamel(operationModel.name, "endpoint", "handler");
}

export function getOperationAcceptConstName(operationModel: models.Operation) {
  return toCamel(operationModel.name, "operation", "accept");
}

export function getAuthenticationMemberName(authenticationModel: models.Authentication) {
  return toCamel(authenticationModel.name);
}

export function getParameterMemberName(parameterModel: models.Parameter) {
  return getParameterMemberName(parameterModel);
}

export function getIsRequestParametersFunction(operationModel: models.Operation) {
  return toCamel("is", operationModel.name, "request", "parameters");
}

export function getIsResponseParametersFunction(
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  return toCamel(
    "is",
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );
}

export function getIsOperationAuthenticationName(operationModel: models.Operation) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getIsAuthenticationFunctionName(operationModel: models.Operation) {
  return toCamel("is", operationModel.name, "authentication");
}

export function getParseParameterFunction(apiModel: models.Api, parameterModel: models.Parameter) {
  const parameterSchemaId = parameterModel.schemaId;
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModel.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("parse", parameterTypeName);
}

export function getMockParameterFunction(apiModel: models.Api, parameterModel: models.Parameter) {
  const parameterSchemaId = parameterModel.schemaId;
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModel.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("mock", parameterTypeName);
}

export function getIsParameterFunction(apiModel: models.Api, parameterModel: models.Parameter) {
  const parameterSchemaId = parameterModel.schemaId;
  if (parameterSchemaId == null) {
    return null;
  }

  const parameterTypeName = apiModel.names[parameterSchemaId];
  if (parameterTypeName == null) {
    return null;
  }

  return toCamel("is", parameterTypeName);
}

export function getMockBodyFunction(apiModel: models.Api, bodyModel: models.Body) {
  const bodySchemaId = bodyModel.schemaId;
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = apiModel.names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("mock", bodyTypeName);
}

export function getIsBodyFunction(apiModel: models.Api, bodyModel: models.Body) {
  const bodySchemaId = bodyModel.schemaId;
  if (bodySchemaId == null) {
    return null;
  }

  const bodyTypeName = apiModel.names[bodySchemaId];
  if (bodyTypeName == null) {
    return null;
  }

  return toCamel("is", bodyTypeName);
}
