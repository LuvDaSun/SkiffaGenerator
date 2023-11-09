import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

/**
 * function statements for route handler
 */
export function* generateRouteHandlerMethodBody(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationHandlerName = toCamel(
    operationModel.name,
    "operation",
    "handler",
  );

  const operationIncomingRequestName = toPascal(
    operationModel.name,
    "incoming",
    "request",
  );

  const requestParametersName = toPascal(
    operationModel.name,
    "request",
    "parameters",
  );

  const isRequestParametersFunction = toCamel(
    "is",
    operationModel.name,
    "request",
    "parameters",
  );

  const isOperationAuthenticationName = toCamel(
    "is",
    operationModel.name,
    "authentication",
  );

  const authenticationNames = Array.from(
    new Set(
      operationModel.authenticationRequirements.flatMap((requirements) =>
        requirements.map((requirement) => requirement.authenticationName),
      ),
    ),
  );

  yield itt`
    const { 
      validateRequestEntity,
      validateResponseEntity,
      validateRequestParameters,
      validateResponseParameters,
    } = this.options;
  `;

  /**
   * read some headers
   */

  yield itt`
    const cookie =
      lib.getParameterValue(serverIncomingRequest.headers, "cookie");
    const accept =
      lib.getParameterValue(serverIncomingRequest.headers, "accept");
    const requestContentType =
      lib.getParameterValue(serverIncomingRequest.headers, "content-type");
  `;

  /**
   * now we put the raw parameters in variables, path parameters are already
   * present, they are in the methods arguments
   */

  yield itt`
    const queryParameters =
      lib.parseParameters(serverIncomingRequest.query, "?", "&", "=");
    const cookieParameters =
      lib.parseParameters(cookie ?? "", "", "; ", "=");
  `;

  /**
   * let's handle authentication
   */

  yield itt`
    const authentication = {
      ${authenticationNames.map(
        (name) => itt`
    ${toCamel(name)}: this.${toCamel(name, "authentication", "handler")}?.(""),
    `,
      )}
    }
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
        ...operationModel.pathParameters.map(
          (parameterModel) => `
    ${toCamel(parameterModel.name)}: 
      lib.getParameterValue(pathParameters, ${JSON.stringify(
        parameterModel.name,
      )}),
    `,
        ),
        ...operationModel.headerParameters.map(
          (parameterModel) => `
    ${toCamel(parameterModel.name)}: 
      lib.getParameterValue(serverIncomingRequest.headers, ${JSON.stringify(
        parameterModel.name,
      )}),
    `,
        ),
        ...operationModel.queryParameters.map(
          (parameterModel) => `
    ${toCamel(parameterModel.name)}: 
      lib.getParameterValue(queryParameters, ${JSON.stringify(
        parameterModel.name,
      )}),
    `,
        ),
        ...operationModel.cookieParameters.map(
          (parameterModel) => `
    ${toCamel(parameterModel.name)}: 
      lib.getParameterValue(cookieParameters, ${JSON.stringify(
        parameterModel.name,
      )}),
    `,
        ),
      ]}
    } as unknown as shared.${requestParametersName};
    if(validateRequestParameters) {
      if(!shared.${isRequestParametersFunction}(requestParameters)) {
        throw new lib.ServerRequestParameterValidationFailed();
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
    yield* generateRequestContentTypeCodeBody(apiModel);
  } else {
    yield itt`
      if(requestContentType == null) {
        throw new lib.MissingServerRequestContentType();
      }

      switch(requestContentType) {
        ${generateRequestContentTypeCodeCaseClauses(apiModel, operationModel)};
      }
    `;
  }

  /**
   * execute the operation handler and collect the response
   */

  yield itt`
    const outgoingResponse =
      this.${operationHandlerName}?.(
        incomingRequest,
        authentication,
      );
    if (outgoingResponse == null) {
      throw new lib.OperationNotImplemented();
    }
  `;

  yield itt`
    let serverOutgoingResponse: lib.ServerOutgoingResponse ;
    switch(outgoingResponse.status) {
      ${generateStatusCodeCaseClauses(apiModel, operationModel)}
    }
  `;

  yield itt`
    return serverOutgoingResponse
  `;
}

function* generateRequestContentTypeCodeCaseClauses(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  for (const bodyModel of operationModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateRequestContentTypeCodeBody(apiModel, bodyModel)}
        break;
      }
    `;
  }
  yield itt`
    default:
      throw new lib.UnexpectedServerRequestContentType();
  `;
}

function* generateRequestContentTypeCodeBody(
  apiModel: models.Api,
  bodyModel?: models.Body,
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
            return incomingRequest.stream(signal);
          },
          lines(signal) {
            return lib.deserializeTextLines(incomingRequest.stream, signal));
          },
          value() {
            return lib.deserializeTextValue(incomingRequest.stream);
          },
        };
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName =
        bodySchemaId == null ? bodySchemaId : apiModel.names[bodySchemaId];
      const isBodyTypeFunction =
        bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!shared.${isBodyTypeFunction}(entity)) {
              throw new lib.ServerRequestEntityValidationFailed();
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
            return incomingRequest.stream(signal);
          },
          entities(signal) {
            let entities = lib.deserializeJsonEntities(
              incomingRequest.stream,
              signal,
            ) as AsyncIterable<${
              bodyTypeName == null ? "unknown" : `shared.${bodyTypeName}`
            }>;
            if(validateRequestEntity) {
              entities = lib.mapAsyncIterable(entities, mapAssertEntity);
            }
            return entities;
          },
          entity() {
            let entity = lib.deserializeJsonEntity(
              incomingRequest.stream
            ) as Promise<${
              bodyTypeName == null ? "unknown" : `shared.${bodyTypeName}`
            }>;
            if(validateRequestEntity) {
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
            return incomingRequest.stream(signal);
          },
        };
      `;
    }
  }
}

function* generateStatusCodeCaseClauses(
  apiModel: models.Api,
  operationModel: models.Operation,
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
            ${generateOperationResultBody(
              apiModel,
              operationModel,
              operationResultModel,
            )}
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
  apiModel: models.Api,
  operationModel: models.Operation,
  operationResultModel: models.OperationResult,
) {
  const responseParametersName = toPascal(
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  const isResponseParametersFunction = toCamel(
    "is",
    operationModel.name,
    operationResultModel.statusKind,
    "response",
    "parameters",
  );

  yield itt`
    if(validateResponseParameters) {
      if(!shared.${isResponseParametersFunction}(outgoingResponse.parameters)) {
        throw new lib.ServerResponseParameterValidationFailed();
      }
    }
  `;

  yield itt`
    const responseHeaders = {};
  `;

  for (const parameterModel of operationResultModel.headerParameters) {
    const parameterName = toCamel(parameterModel.name);

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
    yield* generateOperationResultContentTypeBody(apiModel);
    return;
  } else {
    yield itt`
      switch(outgoingResponse.contentType) {
        ${generateOperationResultContentTypeCaseClauses(
          apiModel,
          operationResultModel,
        )}
      }
    `;
  }
}

function* generateOperationResultContentTypeCaseClauses(
  apiModel: models.Api,
  operationResultModel: models.OperationResult,
) {
  for (const bodyModel of operationResultModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateOperationResultContentTypeBody(apiModel, bodyModel)}
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
  apiModel: models.Api,
  bodyModel?: models.Body,
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
              return lib.serializeTextValue(outgoingResponse.value);
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
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName =
        bodySchemaId == null ? bodySchemaId : apiModel.names[bodySchemaId];
      const isBodyTypeFunction =
        bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!shared.${isBodyTypeFunction}(entity)) {
              throw new lib.ServerResponseEntityValidationFailed();
            }
          `
          }
          return entity as ${
            bodyTypeName == null ? "unknown" : `shared.${bodyTypeName}`
          };
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
              if(validateResponseEntity) {
                entities = lib.mapAsyncIterable(entities, mapAssertEntity);
              }
              return lib.serializeJsonEntities(outgoingResponse.entities(signal));
            }
            else if("entity" in outgoingResponse) {
              let entity = outgoingResponse.entity();
              if(validateResponseEntity) {
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
