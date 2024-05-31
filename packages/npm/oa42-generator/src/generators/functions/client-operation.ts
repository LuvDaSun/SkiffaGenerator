import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getAuthenticationMemberName,
  getDefaultCredentialsConstantName,
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
} from "../names/index.js";

export function* generateClientOperationFunction(
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
  pathModel: core.PathContainer,
  operationModel: core.OperationContainer,
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
    operationCredentials: ${credentialsName} = {},
    operationConfiguration: ClientConfiguration = {},
  ): Promise<${operationIncomingResponseName}> {
    ${generateBody(apiModelLegacy, apiModel, pathModel, operationModel)}
  }
`;
}

function* generateBody(
  apiModelLegacy: models.Api,
  apiModel: core.ApiContainer,
  pathModel: core.PathContainer,
  operationModel: core.OperationContainer,
) {
  const operationIncomingResponseName = getIncomingResponseTypeName(operationModel);
  const operationAcceptConstName = getOperationAcceptConstName(operationModel);
  const isRequestParametersFunction = getIsRequestParametersFunction(operationModel);
  const defaultCredentialsName = getDefaultCredentialsConstantName();

  yield itt`
    const credentials = {...operationCredentials, ...${defaultCredentialsName}}
  `;

  yield itt`
    const configuration = {...operationConfiguration, ...defaultClientConfiguration}
  `;

  yield itt`
    const {
      baseUrl,
      validateIncomingEntity,
      validateIncomingParameters,
      validateOutgoingEntity,
      validateOutgoingParameters,
    } = configuration;

    if(baseUrl == null) {
      throw new Error("please set baseUrl");
    }
  `;

  yield itt`
    const pathParameters = {};
    const queryParameters = {};
    const requestHeaders = new Headers();
    const cookieParameters = {};
  `;

  yield itt`
    if(validateOutgoingParameters) {
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
              if(credentials.${getAuthenticationMemberName(authenticationModel)} != null) {
                queryParameters.append(${JSON.stringify(authenticationModel.name)}, credentials.${getAuthenticationMemberName(authenticationModel)});
              }
            `;
            break;
          }

          case "header": {
            yield itt`
              if(credentials.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append(${JSON.stringify(authenticationModel.name)}, credentials.${getAuthenticationMemberName(authenticationModel)});
              }
            `;
            break;
          }

          case "cookie": {
            yield itt`
              if(credentials.${getAuthenticationMemberName(authenticationModel)} != null) {
                cookieParameters.append(${JSON.stringify(authenticationModel.name)}, credentials.${getAuthenticationMemberName(authenticationModel)});
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
              if(credentials.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append("authorization", lib.stringifyBasicAuthorizationHeader(credentials.${getAuthenticationMemberName(authenticationModel)}));
              }
            `;
            break;

          case "bearer":
            yield itt`
              if(credentials.${getAuthenticationMemberName(authenticationModel)} != null) {
                requestHeaders.append("authorization", lib.stringifyAuthorizationHeader("Bearer", credentials.${getAuthenticationMemberName(authenticationModel)}));
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

    const url = new URL(path, baseUrl);
    let body: BodyInit | null;  
    `;

  if (operationModel.bodies.length === 0) {
    yield* generateRequestContentTypeCodeBody(apiModelLegacy, operationModel);
  } else {
    yield itt`  
        switch(outgoingRequest.contentType){
          ${generateRequestContentTypeCaseClauses(apiModelLegacy, operationModel)}
        }
      `;
  }

  yield itt`
      const requestInit: RequestInit = {
        headers: requestHeaders,
        method: ${JSON.stringify(core.Method[operationModel.method].toUpperCase())},
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
        ${generateResponseStatusCodeCaseClauses(apiModelLegacy, operationModel)}
      }
    `;

  yield itt`
      return incomingResponse;
    `;
}

function* generateRequestContentTypeCaseClauses(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
) {
  for (const bodyModel of operationModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}: {
        requestHeaders.append("content-type", outgoingRequest.contentType);

        ${generateRequestContentTypeCodeBody(apiModelLegacy, operationModel, bodyModel)}
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
      throw new lib.UnexpectedStatusCode(fetchResponse.status)  
  `;
}

function* generateOperationResultBody(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  operationResultModel: core.OperationResultContainer,
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
        const parseParameterFunction = getParseParameterFunction(apiModelLegacy, parameterModel);

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

    if(validateIncomingParameters) {
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

  if (operationResultModel.bodies.length === 0) {
    yield* generateOperationResultContentTypeBody(apiModelLegacy);
    return;
  } else {
    yield itt`
      if (responseContentType == null) {
        throw new lib.ClientResponseMissingContentType();
      }

      switch(responseContentType) {
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
      throw new lib.ClientResponseUnexpectedContentType();       
  `;
}

function* generateRequestContentTypeCodeBody(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
  bodyModel?: core.BodyContainer,
) {
  if (bodyModel == null) {
    yield itt`
      body = null;
    `;
    return;
  }

  switch (bodyModel.contentType) {
    case "text/plain": {
      yield itt`
        let stream: AsyncIterable<Uint8Array>;
        if("stream" in outgoingRequest) {
          stream = outgoingRequest.stream();
        }
        else if("lines" in outgoingRequest) {
          stream = lib.serializeTextLines(outgoingRequest.lines());
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
          if(validateOutgoingEntity) {
            entities = lib.mapAsyncIterable(entities, mapAssertEntity);
          }
          stream = lib.serializeJsonEntities(entities);
        }
        else if("entity" in outgoingRequest) {
          let entity = outgoingRequest.entity();
          if(validateOutgoingEntity) {
            entity = lib.mapPromisable(entity, mapAssertEntity);
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
  apiModelLegacy: models.Api,
  bodyModel?: core.BodyContainer,
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
    case "text/plain": {
      yield itt`
        incomingResponse = {
          status: fetchResponse.status,
          contentType: responseContentType,
          parameters: responseParameters,
          stream: (signal) => {
            return stream(signal)
          },
          lines(signal) {
            return lib.deserializeTextLines(stream, signal);
          },
          value() {
            return lib.deserializeTextValue(stream);
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
            let entities = lib.deserializeJsonEntities(
              stream,
              signal,
            ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(validateIncomingEntity) {
              entities = lib.mapAsyncIterable(entities, mapAssertEntity);
            }
            return entities;
          },
          entity() {
            let entity = lib.deserializeJsonEntity(
              stream
            ) as Promise<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
            if(validateIncomingEntity) {
              entity = lib.mapPromisable(entity, mapAssertEntity);
            }
            return entity;
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
