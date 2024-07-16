import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import { selectBodies } from "../helpers.js";
import {
  getAuthenticationMemberName,
  getIncomingResponseTypeName,
  getIsRequestParametersFunction,
  getIsResponseParametersFunction,
  getOperationAcceptConstName,
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getOutgoingRequestTypeName,
  getParameterMemberName,
  getParseParameterFunction,
  getResponseParametersTypeName,
} from "../names.js";

export function* generateClientOperationFunction(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationFunctionName = getOperationFunctionName(operationModel);
  const operationOutgoingRequestName = getOutgoingRequestTypeName(operationModel);
  const operationIncomingResponseName = getIncomingResponseTypeName(operationModel);
  const credentialsName = getOperationCredentialsTypeName(operationModel);

  const jsDoc = [
    operationModel.deprecated ? "@deprecated" : "",
    operationModel.summary ?? "",
    operationModel.description ?? "",
  ]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  yield itt`
  /**
    ${jsDoc}
   */
  export async function ${operationFunctionName}(
    outgoingRequest: ${operationOutgoingRequestName},
    configuration: ClientConfiguration & ${credentialsName},
  ): Promise<${operationIncomingResponseName}> {
    ${generateBody(names, apiModel, pathModel, operationModel, requestTypes, responseTypes)}
  }
`;
}

function* generateBody(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationIncomingResponseName = getIncomingResponseTypeName(operationModel);
  const operationAcceptConstName = getOperationAcceptConstName(operationModel);
  const isRequestParametersFunction = getIsRequestParametersFunction(operationModel);

  yield itt`
    const pathParameters = {};
    const queryParameters = {};
    const requestHeaders = new Headers();
    const cookieParameters = {};
  `;

  yield itt`
    if(configuration.validateOutgoingParameters) {
      if(!parameters.${isRequestParametersFunction}(outgoingRequest.parameters ?? {})) {
        const lastError = parameters.getLastParameterValidationError();
        throw new lib.ClientRequestParameterValidationFailed(
          lastError.parameterName,
          lastError.path,
          lastError.rule,
        );
      }
    }
  `;

  for (const parameterModel of operationModel.pathParameters) {
    const parameterName = getParameterMemberName(parameterModel);
    const addParameterCode = itt`
      lib.addParameter(
        pathParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} == null ? "" : String(outgoingRequest.parameters.${parameterName}),
      );
    `;

    if (parameterModel.required) {
      yield addParameterCode;
    } else {
      yield itt`
        if (outgoingRequest.parameters.${parameterName} !== undefined) {
          ${addParameterCode}    
        }
      `;
    }
  }

  for (const parameterModel of operationModel.queryParameters) {
    const parameterName = getParameterMemberName(parameterModel);
    const addParameterCode = itt`
      lib.addParameter(
        queryParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} == null ? "" : String(outgoingRequest.parameters.${parameterName}),
      );
    `;

    if (parameterModel.required) {
      yield addParameterCode;
    } else {
      yield itt`
        if (outgoingRequest.parameters.${parameterName} !== undefined) {
          ${addParameterCode}    
        }
      `;
    }
  }

  for (const parameterModel of operationModel.headerParameters) {
    const parameterName = getParameterMemberName(parameterModel);
    const addParameterCode = itt`
      requestHeaders.append(
        ${JSON.stringify(parameterModel.name)}, 
        outgoingRequest.parameters.${parameterName} == null ? "" : String(outgoingRequest.parameters.${parameterName}),
      );
    `;

    if (parameterModel.required) {
      yield addParameterCode;
    } else {
      yield itt`
        if (outgoingRequest.parameters.${parameterName} !== undefined) {
          ${addParameterCode}    
        }
      `;
    }
  }

  for (const parameterModel of operationModel.cookieParameters) {
    const parameterName = getParameterMemberName(parameterModel);
    const addParameterCode = itt`
      lib.addParameter(
        cookieParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} == null ? "" : String(outgoingRequest.parameters.${parameterName}),
      );
    `;

    if (parameterModel.required) {
      yield addParameterCode;
    } else {
      yield itt`
        if (outgoingRequest.parameters.${parameterName} !== undefined) {
          ${addParameterCode}    
        }
      `;
    }
  }

  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((group) =>
      group.requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  for (const authenticationModel of authenticationModels) {
    switch (authenticationModel.type) {
      case "apiKey":
        switch (authenticationModel.in) {
          case "query": {
            yield itt`
              if(configuration.${getAuthenticationMemberName(authenticationModel)} != null) {
                queryParameters.append(${JSON.stringify(authenticationModel.name)}, configuration.${getAuthenticationMemberName(authenticationModel)});
              }
            `;
            break;
          }

          case "header": {
            yield itt`
              if(configuration.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append(${JSON.stringify(authenticationModel.name)}, configuration.${getAuthenticationMemberName(authenticationModel)});
              }
            `;
            break;
          }

          case "cookie": {
            yield itt`
              if(configuration.${getAuthenticationMemberName(authenticationModel)} != null) {
                cookieParameters.append(${JSON.stringify(authenticationModel.name)}, configuration.${getAuthenticationMemberName(authenticationModel)});
              }
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
              if(configuration.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append("authorization", lib.stringifyBasicAuthorizationHeader(configuration.${getAuthenticationMemberName(authenticationModel)}));
              }
            `;
            break;

          case "bearer":
            yield itt`
              if(configuration.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append("authorization", lib.stringifyAuthorizationHeader("Bearer", configuration.${getAuthenticationMemberName(authenticationModel)}));
              }
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

  yield itt`
    const path =
      router.stringifyRoute(
        ${JSON.stringify(pathModel.id)},
        pathParameters,
      ) +
      lib.stringifyParameters(
        queryParameters,
        "?", "&", "=",
      );
    const cookie = lib.stringifyParameters(
      cookieParameters,
      "", "; ", "=",
    );
    if(cookie !== ""){
      requestHeaders.append("set-cookie", cookie);
    }

    requestHeaders.append("accept", lib.stringifyAcceptHeader(shared.${operationAcceptConstName}));

    const url = new URL(path, configuration.baseUrl);
    let body: BodyInit | null;  
    `;

  const requestBodyModels = selectBodies(operationModel, requestTypes);

  if (requestBodyModels.length === 0) {
    yield* generateRequestContentTypeCodeBody(names, operationModel);
  } else {
    yield itt`  
        switch(outgoingRequest.contentType){
          ${generateRequestContentTypeCaseClauses(names, operationModel, requestTypes)}
        }
      `;
  }

  yield itt`
      const requestInit: RequestInit = {
        headers: requestHeaders,
        method: ${JSON.stringify(operationModel.method.toUpperCase())},
        redirect: "manual",
        body,
      };
      const fetchResponse = await fetch(url, requestInit);
  
      const responseContentType = 
        fetchResponse.headers.get("content-type");
  
      let incomingResponse: ${operationIncomingResponseName};
    `;

  yield itt`
      switch(fetchResponse.status) {
        ${generateResponseStatusCodeCaseClauses(names, operationModel, responseTypes)}
      }
    `;

  yield itt`
      return incomingResponse;
    `;
}

function* generateRequestContentTypeCaseClauses(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
) {
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  for (const bodyModel of requestBodyModels) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}: {
        requestHeaders.append("content-type", outgoingRequest.contentType);

        ${generateRequestContentTypeCodeBody(names, operationModel, bodyModel)}
        break;
      }
    `;
  }

  yield itt`
    default:
      throw new lib.Unreachable();
  `;
}

function* generateResponseStatusCodeCaseClauses(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  responseTypes: Array<string>,
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
            ${generateOperationResultBody(names, operationModel, operationResultModel, responseTypes)}
            break;
          }
        `;
      }
    }
  }

  yield itt`
    default:
      throw new lib.UnexpectedStatusCode(fetchResponse.status)  
  `;
}

function* generateOperationResultBody(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
) {
  const responseParametersName = getResponseParametersTypeName(
    operationModel,
    operationResultModel,
  );
  const isResponseParametersFunction = getIsResponseParametersFunction(
    operationModel,
    operationResultModel,
  );

  yield itt`
    const responseParameters = {
      ${operationResultModel.headerParameters.map((parameterModel) => {
        const parameterName = getParameterMemberName(parameterModel);
        const parseParameterFunction = getParseParameterFunction(names, parameterModel);

        if (parseParameterFunction == null) {
          return `
            ${parameterName}: fetchResponse.headers.get(${JSON.stringify(parameterModel.name)}),
          `;
        }

        return `
          ${parameterName}: parsers.${parseParameterFunction}(fetchResponse.headers.get(${JSON.stringify(
            parameterModel.name,
          )})),
        `;
      })}
    } as parameters.${responseParametersName};

    if(configuration.validateIncomingParameters) {
      if(!parameters.${isResponseParametersFunction}(responseParameters)) {
        const lastError = parameters.getLastParameterValidationError();
        throw new lib.ClientResponseParameterValidationFailed(
          lastError.parameterName,
          lastError.path,
          lastError.rule,
        );
      }
    }
  `;

  const responseBodyModels = selectBodies(operationResultModel, responseTypes);

  if (responseBodyModels.length === 0) {
    yield* generateOperationResultContentTypeBody(names);
    return;
  } else {
    yield itt`
      if (responseContentType == null) {
        throw new lib.ClientResponseMissingContentType();
      }

      switch(responseContentType) {
        ${generateOperationResultContentTypeCaseClauses(names, operationResultModel, responseTypes)}
      }
    `;
  }
}

function* generateOperationResultContentTypeCaseClauses(
  names: Record<string, string>,
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
) {
  const responseBodyModels = selectBodies(operationResultModel, responseTypes);

  for (const bodyModel of responseBodyModels) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateOperationResultContentTypeBody(names, bodyModel)}
        break;
      }
    `;
  }

  yield itt`
    default:
      throw new lib.ClientResponseUnexpectedContentType();       
  `;
}

function* generateRequestContentTypeCodeBody(
  names: Record<string, string>,
  operationModel: skiffaCore.OperationContainer,
  bodyModel?: skiffaCore.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      body = null;
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "application/x-ndjson": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ClientResponseEntityValidationFailed(
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
        let stream: AsyncIterable<Uint8Array>;
        if("stream" in outgoingRequest) {
          stream = outgoingRequest.stream(undefined);
        }
        else if("entities" in outgoingRequest) {
          let entities = outgoingRequest.entities(undefined);
          if(configuration.validateOutgoingEntity) {
            entities = lib.mapAsyncIterable(entities, mapAssertEntity);
          }
          stream = lib.serializeNdjsonEntities(entities);
        }
        else {
          throw new lib.Unreachable();
        }
        body = await lib.collectStream(stream);
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ClientResponseEntityValidationFailed(
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
        let stream: AsyncIterable<Uint8Array>;
        if("stream" in outgoingRequest) {
          stream = outgoingRequest.stream(undefined);
        }
        else if("entity" in outgoingRequest) {
          let entity = outgoingRequest.entity();
          if(configuration.validateOutgoingEntity) {
            entity = lib.mapPromise(entity, mapAssertEntity);
          }
          stream = lib.serializeJsonEntity(entity);
        }
        else {
          throw new lib.Unreachable();
        }
        body = await lib.collectStream(stream);
      `;
      break;
    }

    case "text/plain": {
      yield itt`
        let stream: AsyncIterable<Uint8Array>;
        if("stream" in outgoingRequest) {
          stream = outgoingRequest.stream();
        }
        else if("value" in outgoingRequest) {
          stream = lib.serializeTextValue(outgoingRequest.value());
        }
        else {
          throw new lib.Unreachable();
        }
        body = await lib.collectStream(stream);
      `;
      break;
    }

    default: {
      yield itt`
        let stream: AsyncIterable<Uint8Array>;
        if("stream" in outgoingRequest) {
          stream = outgoingRequest.stream();
        }
        else {
          throw new lib.Unreachable();
        }
        body = await lib.collectStream(stream);
      `;
    }
  }
}

function* generateOperationResultContentTypeBody(
  names: Record<string, string>,
  bodyModel?: skiffaCore.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      incomingResponse = {
        status: fetchResponse.status,
        contentType: null,
        parameters: responseParameters,
      }
    `;
    return;
  }

  yield itt`
    const responseBody = fetchResponse.body;
    if (responseBody == null) {
      throw new Error("expected body");
    }
  `;

  yield itt`
    const stream = (signal?: AbortSignal) => lib.fromReadableStream(
      responseBody,
      signal
    );
  `;
  switch (bodyModel.contentType) {
    case "application/x-ndjson": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ClientResponseEntityValidationFailed(
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
        incomingResponse = {
          status: fetchResponse.status,
          contentType: responseContentType,
          parameters: responseParameters,
          stream: (signal) => {
            return stream(signal)
          },
          entities(signal) {
            let entities = lib.deserializeNdjsonEntities(
              stream,
              signal,
            ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(configuration.validateIncomingEntity) {
              entities = lib.mapAsyncIterable(entities, mapAssertEntity);
            }
            return entities;
          },
        }
      `;
      break;
    }

    case "application/json": {
      const bodySchemaId = bodyModel.schemaId;
      const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
      const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

      yield itt`
        const mapAssertEntity = (entity: unknown) => {
          ${
            isBodyTypeFunction == null
              ? ""
              : itt`
            if(!validators.${isBodyTypeFunction}(entity)) {
              const lastError = validators.getLastValidationError();
              throw new lib.ClientResponseEntityValidationFailed(
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
        incomingResponse = {
          status: fetchResponse.status,
          contentType: responseContentType,
          parameters: responseParameters,
          stream: (signal) => {
            return stream(signal)
          },
          entity() {
            let entity = lib.deserializeJsonEntity(
              stream
            ) as Promise<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(configuration.validateIncomingEntity) {
              entity = lib.mapPromise(entity, mapAssertEntity);
            }
            return entity;
          },
        }
      `;
      break;
    }

    case "text/plain": {
      yield itt`
        incomingResponse = {
          status: fetchResponse.status,
          contentType: responseContentType,
          parameters: responseParameters,
          stream: (signal) => {
            return stream(signal)
          },
          value() {
            return lib.deserializeTextValue(stream);
          },
        }
      `;
      break;
    }

    default: {
      yield itt`
        incomingResponse = {
          status: fetchResponse.status,
          contentType: responseContentType,
          parameters: responseParameters,
          stream: (signal) => {
            return stream(signal)
          },
        }
      `;
    }
  }
}
