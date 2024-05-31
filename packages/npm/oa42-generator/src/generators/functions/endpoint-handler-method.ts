import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationMemberName,
  getEndpointHandlerName,
  getIncomingRequestTypeName,
  getIsOperationAuthenticationName,
  getIsRequestParametersFunction,
  getIsResponseParametersFunction,
  getOperationAcceptConstName,
  getOperationAcceptTypeName,
  getOperationHandlerName,
  getParameterMemberName,
  getParseParameterFunction,
  getRequestParametersTypeName,
} from "../names/index.js";

export function* generateEndpointHandlerMethod(
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
  operationModel: core.OperationContainer,
) {
  const endpointHandlerName = getEndpointHandlerName(operationModel);

  yield itt`
    private ${endpointHandlerName}(
      pathParameters: Record<string, string>,
      serverIncomingRequest: lib.ServerIncomingRequest,
    ): Promise<lib.ServerOutgoingResponse> {
      return this.wrappers.endpoint(async () => {
        ${generateBody(apiModelLegacy, apiModel, operationModel)}
      });
    }
  `;
}

/**
 * function statements for route handler
 */
function* generateBody(
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
  operationModel: core.OperationContainer,
) {
  const operationHandlerName = getOperationHandlerName(operationModel);
  const operationIncomingRequestName = getIncomingRequestTypeName(operationModel);
  const requestParametersName = getRequestParametersTypeName(operationModel);
  const isRequestParametersFunction = getIsRequestParametersFunction(operationModel);
  const isOperationAuthenticationName = getIsOperationAuthenticationName(operationModel);
  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((group) =>
      group.requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );
  const operationAcceptTypeName = getOperationAcceptTypeName(operationModel);
  const operationAcceptConstName = getOperationAcceptConstName(operationModel);

  yield itt`
    const { 
      validateIncomingEntity,
      validateIncomingParameters,
      validateOutgoingEntity,
      validateOutgoingParameters,
    } = this.configuration;
  `;

  /**
   * read some headers
   */

  yield itt`
    const cookie =
      lib.getParameterValues(serverIncomingRequest.headers, "cookie");
    const requestContentType =
      lib.first(lib.getParameterValues(serverIncomingRequest.headers, "content-type"));
    const responseAccepts =
      lib.parseAcceptHeader(lib.getParameterValues(serverIncomingRequest.headers, "accept"));
  `;

  /**
   * now we put the raw parameters in variables, path parameters are already
   * present, they are in the methods arguments
   */

  yield itt`
    const queryParameters =
      lib.parseParameters([serverIncomingRequest.query], "?", "&", "=");
    const cookieParameters = 
      lib.parseParameters(cookie, "", "; ", "=");
  `;

  /*
  set accept for use in 
  */
  yield itt`
    const accepts = [
      ...lib.intersect(responseAccepts, shared.${operationAcceptConstName}),
    ] as shared.${operationAcceptTypeName}[];
  `;

  /**
   * let's handle authentication
   */

  yield itt`
    const credentials = {
      ${generateCredentialsContent()}
    }
  `;

  yield itt`
    const authentication = Object.fromEntries(
      await Promise.all([
        ${authenticationModels.map(
          (authenticationModel) => itt`
            (
              async () => [
                ${JSON.stringify(getAuthenticationMemberName(authenticationModel))},
                credentials.${getAuthenticationMemberName(authenticationModel)} == null ?
                  undefined :
                  await this.authenticationHandlers.${getAuthenticationHandlerName(authenticationModel)}?.
                    (credentials.${getAuthenticationMemberName(authenticationModel)})
              ]
            )(),
          `,
        )}
      ]),
    ) as A;

    if(!${isOperationAuthenticationName}(authentication)) {
      throw new lib.AuthenticationFailed();
    }
  `;

  /**
   * create the request parameters object
   */

  yield itt`
    const requestParameters = {
      ${[
        ...operationModel.pathParameters.map((parameterModel) => {
          const parameterName = getParameterMemberName(parameterModel);
          const parseParameterFunction = getParseParameterFunction(apiModelLegacy, parameterModel);

          if (parseParameterFunction == null) {
            return `
              ${parameterName}: 
                lib.first(lib.getParameterValues(pathParameters, ${JSON.stringify(parameterModel.name)})),
            `;
          }

          return `
            ${parameterName}: 
              parsers.${parseParameterFunction}(lib.getParameterValues(pathParameters, ${JSON.stringify(
                parameterModel.name,
              )})),
          `;
        }),
        ...operationModel.headerParameters.map((parameterModel) => {
          const parameterName = getParameterMemberName(parameterModel);
          const parseParameterFunction = getParseParameterFunction(apiModelLegacy, parameterModel);

          if (parseParameterFunction == null) {
            return `
              ${parameterName}: 
              lib.first(lib.getParameterValues(pathParameters, ${JSON.stringify(parameterModel.name)})),
            `;
          }

          return `
          ${parameterName}: 
              parsers.${parseParameterFunction}(lib.getParameterValues(serverIncomingRequest.headers, ${JSON.stringify(
                parameterModel.name,
              )})),
          `;
        }),
        ...operationModel.queryParameters.map((parameterModel) => {
          const parameterName = getParameterMemberName(parameterModel);
          const parseParameterFunction = getParseParameterFunction(apiModelLegacy, parameterModel);

          if (parseParameterFunction == null) {
            return `
              ${parameterName}: 
                lib.first(lib.getParameterValues(queryParameters, ${JSON.stringify(parameterModel.name)})),
            `;
          }

          return `
            ${parameterName}: 
              parsers.${parseParameterFunction}(lib.getParameterValues(queryParameters, ${JSON.stringify(
                parameterModel.name,
              )})),
          `;
        }),
        ...operationModel.cookieParameters.map((parameterModel) => {
          const parameterName = getParameterMemberName(parameterModel);
          const parseParameterFunction = getParseParameterFunction(apiModelLegacy, parameterModel);

          if (parseParameterFunction == null) {
            return `
              ${parameterName}: 
                lib.first(lib.getParameterValues(cookieParameters, ${JSON.stringify(parameterModel.name)})),
            `;
          }

          return `
            ${parameterName}: 
              parsers.${parseParameterFunction}(lib.getParameterValues(cookieParameters, ${JSON.stringify(
                parameterModel.name,
              )})),
          `;
        }),
      ]}
    } as parameters.${requestParametersName};

    if(validateIncomingParameters) {
      if(!parameters.${isRequestParametersFunction}(requestParameters)) {
        const lastError = parameters.getLastParameterValidationError();
        throw new lib.ServerRequestParameterValidationFailed(
          lastError.parameterName,
          lastError.path,
          lastError.rule
        );
      }
    }
  `;

  /**
   * now lets construct the incoming request object, this object will be
   * passed to the operation handler later
   */

  yield itt`
    let incomingRequest: ${operationIncomingRequestName};
  `;

  if (operationModel.bodies.length === 0) {
    yield* generateRequestContentTypeCodeBody(apiModelLegacy);
  } else {
    yield itt`
      if(requestContentType == null) {
        throw new lib.ServerRequestMissingContentType();
      }

      switch(requestContentType) {
        ${generateRequestContentTypeCodeCaseClauses(apiModelLegacy, operationModel)};
      }
    `;
  }

  /**
   * execute the operation handler and collect the response
   */

  yield itt`
    const outgoingResponse = await this.operationHandlers.${operationHandlerName}?.(
      incomingRequest,
      authentication,
      accepts
    );
    if (outgoingResponse == null) {
      throw new lib.OperationNotImplemented();
    }
  `;

  yield itt`
    let serverOutgoingResponse: lib.ServerOutgoingResponse;
    switch(outgoingResponse.status) {
      ${generateStatusCodeCaseClauses(apiModelLegacy, operationModel)}
    }
  `;

  yield itt`
    return serverOutgoingResponse
  `;

  function* generateCredentialsContent() {
    for (const authenticationModel of authenticationModels) {
      switch (authenticationModel.type) {
        case "apiKey":
          switch (authenticationModel.in) {
            case "query": {
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.first(lib.getParameterValues(queryParameters, ${JSON.stringify(authenticationModel.name)})),
              `;
              break;
            }

            case "header": {
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.first(lib.getParameterValues(serverIncomingRequest.headers, ${JSON.stringify(authenticationModel.name)})),
              `;
              break;
            }

            case "cookie": {
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.first(lib.getParameterValues(cookieParameters, ${JSON.stringify(authenticationModel.name)})),
              `;
              break;
            }
            default:
              throw "impossible";
          }
          break;

        case "http":
          switch (authenticationModel.scheme) {
            case "basic":
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.parseBasicAuthorizationHeader(lib.getParameterValues(serverIncomingRequest.headers, "authorization")),
              `;
              break;

            case "bearer":
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.parseAuthorizationHeader("bearer", lib.getParameterValues(serverIncomingRequest.headers, "authorization")),
              `;
              break;

            default: {
              throw "impossible";
            }
          }
          break;

        default: {
          throw "impossible";
        }
      }
    }
  }
}

function* generateRequestContentTypeCodeCaseClauses(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
) {
  for (const bodyModel of operationModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateRequestContentTypeCodeBody(apiModelLegacy, bodyModel)}
        break;
      }
    `;
  }
  yield itt`
    default:
      throw new lib.ServerRequestUnexpectedContentType();
  `;
}

function* generateRequestContentTypeCodeBody(
  apiModelLegacy: models.Api,
  bodyModel?: core.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      incomingRequest = {
        parameters: requestParameters,
        contentType: null,
      };
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        incomingRequest = {
          parameters: requestParameters,
          contentType: requestContentType,
          stream(signal) {
            return serverIncomingRequest.stream(signal);
          },
          lines(signal) {
            return lib.deserializeTextLines(serverIncomingRequest.stream, signal);
          },
          value() {
            return lib.deserializeTextValue(serverIncomingRequest.stream);
          },
        };
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId?.toString();
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : apiModelLegacy.names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ServerRequestEntityValidationFailed(
                lastError.path,
                lastError.rule,
              );
            }
          `
          }
          return entity;
        };
      `;

      yield itt`
        incomingRequest = {
          parameters: requestParameters,
          contentType: requestContentType,
          stream(signal) {
            return serverIncomingRequest.stream(signal);
          },
          entities(signal) {
            let entities = lib.deserializeJsonEntities(
              serverIncomingRequest.stream,
              signal,
            ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(validateIncomingEntity) {
              entities = lib.mapAsyncIterable(entities, mapAssertEntity);
            }
            return entities;
          },
          entity() {
            let entity = lib.deserializeJsonEntity(
              serverIncomingRequest.stream
            ) as Promise<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(validateIncomingEntity) {
              entity = lib.mapPromisable(entity, mapAssertEntity);
            }
            return entity;
          },
        };
      `;
      break;
    }

    default: {
      yield itt`
        incomingRequest = {
          parameters: requestParameters,
          contentType: requestContentType,
          stream(signal) {
            return serverIncomingRequest.stream(signal);
          },
        };
      `;
    }
  }
}

function* generateStatusCodeCaseClauses(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
) {
  for (const operationResultModel of operationModel.operationResults) {
    const statusCodes = [...operationResultModel.statusCodes];
    let statusCode;
    while ((statusCode = statusCodes.shift()) != null) {
      yield itt`case ${JSON.stringify(statusCode)}:`;
      // it's te last one!
      if (statusCodes.length === 0) {
        yield itt`
          {
            ${generateOperationResultBody(apiModelLegacy, operationModel, operationResultModel)}
            break;
          }
        `;
      }
    }
  }

  yield itt`
    default:
      throw new lib.Unreachable();
  `;
}

function* generateOperationResultBody(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
) {
  const isResponseParametersFunction = getIsResponseParametersFunction(
    operationModel,
    operationResultModel,
  );

  yield itt`
    if(validateOutgoingParameters) {
      if(!parameters.${isResponseParametersFunction}(outgoingResponse.parameters ?? {})) {
        const lastError = parameters.getLastParameterValidationError();
        throw new lib.ServerResponseParameterValidationFailed(
          lastError.parameterName,
          lastError.path,
          lastError.rule,
        );
      }
    }
  `;

  yield itt`
    const responseHeaders = {};
  `;

  for (const parameterModel of operationResultModel.headerParameters) {
    const parameterName = getParameterMemberName(parameterModel);

    const addParameterCode = itt`
      lib.addParameter(
        responseHeaders,
        ${JSON.stringify(parameterModel.name)},
        outgoingResponse.parameters.${parameterName}.toString(),
      );
    `;

    if (parameterModel.required) {
      yield addParameterCode;
    } else {
      yield itt`
        if (outgoingResponse.parameters.${parameterName} !== undefined) {
          ${addParameterCode}    
        }
      `;
    }
  }

  if (operationResultModel.bodies.length === 0) {
    yield* generateOperationResultContentTypeBody(apiModelLegacy);
    return;
  } else {
    yield itt`
      switch(outgoingResponse.contentType) {
        ${generateOperationResultContentTypeCaseClauses(apiModelLegacy, operationResultModel)}
      }
    `;
  }
}

function* generateOperationResultContentTypeCaseClauses(
  apiModelLegacy: models.Api,
  operationResultModel: core.OperationResultContainer,
) {
  for (const bodyModel of operationResultModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateOperationResultContentTypeBody(apiModelLegacy, bodyModel)}
        break;
      }
    `;
  }

  yield itt`
    default:
      throw new lib.Unreachable();       
  `;
}

function* generateOperationResultContentTypeBody(
  apiModelLegacy: models.Api,
  bodyModel?: core.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      serverOutgoingResponse = {
        status: outgoingResponse.status,
        headers: responseHeaders,
      }    
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        lib.addParameter(responseHeaders, "content-type", outgoingResponse.contentType);
        serverOutgoingResponse = {
          status: outgoingResponse.status,
          headers: responseHeaders,
          stream(signal) {
            if("stream" in outgoingResponse) {
              return outgoingResponse.stream(signal);
            }
            else if("lines" in outgoingResponse) {
              return lib.serializeTextLines(outgoingResponse.lines(signal));
            }
            else if("value" in outgoingResponse) {
              return lib.serializeTextValue(outgoingResponse.value());
            }
            else {
              throw new lib.Unreachable();
            }
          },
        }
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId?.toString();
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : apiModelLegacy.names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ServerResponseEntityValidationFailed(
                lastError.path,
                lastError.rule,
              );
            }
          `
          }
          return entity as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
        }
      `;

      yield itt`
        lib.addParameter(responseHeaders, "content-type", outgoingResponse.contentType);
        serverOutgoingResponse = {
          status: outgoingResponse.status,
          headers: responseHeaders,
          stream(signal) {
            if("stream" in outgoingResponse) {
              return outgoingResponse.stream(signal);
            }
            else if("entities" in outgoingResponse) {
              let entities = outgoingResponse.entities(signal);
              if(validateOutgoingEntity) {
                entities = lib.mapAsyncIterable(entities, mapAssertEntity);
              }
              return lib.serializeJsonEntities(outgoingResponse.entities(signal));
            }
            else if("entity" in outgoingResponse) {
              let entity = outgoingResponse.entity();
              if(validateOutgoingEntity) {
                entity = lib.mapPromisable(entity, mapAssertEntity);
              }
              return lib.serializeJsonEntity(entity);
            }
            else {
              throw new lib.Unreachable();
            }
          },
        }
      `;
      break;
    }

    default: {
      yield itt`
        lib.addParameter(responseHeaders, "content-type", outgoingResponse.contentType);
        serverOutgoingResponse = {
          status: outgoingResponse.status,
          headers: responseHeaders,
          stream(signal) {
            if("stream" in outgoingResponse) {
              return outgoingResponse.stream(signal);
            }
            else {
              throw new lib.Unreachable();
            }
          },
        }
      `;
    }
  }
}
