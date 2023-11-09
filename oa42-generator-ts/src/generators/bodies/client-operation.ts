import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateClientOperationFunctionBody(
  apiModel: models.Api,
  pathModel: models.Path,
  operationModel: models.Operation,
) {
  const operationIncomingResponseName = toPascal(
    operationModel.name,
    "incoming",
    "response",
  );

  const isRequestParametersFunction = toCamel(
    "is",
    operationModel.name,
    "request",
    "parameters",
  );

  yield itt`
    const {
      baseUrl,
      validateRequestEntity,
      validateResponseEntity,
      validateRequestParameters,
      validateResponseParameters,
    } = options;

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
    if(validateRequestParameters) {
      if(!shared.${isRequestParametersFunction}(outgoingRequest.parameters)) {
        throw new lib.ClientRequestParameterValidationFailed();
      }
    }
  `;

  for (const parameterModel of operationModel.pathParameters) {
    const parameterName = toCamel(parameterModel.name);
    const addParameterCode = itt`
      lib.addParameter(
        pathParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} as unknown as string,
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
    const parameterName = toCamel(parameterModel.name);
    const addParameterCode = itt`
      lib.addParameter(
        queryParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} as unknown as string,
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
    const parameterName = toCamel(parameterModel.name);
    const addParameterCode = itt`
      requestHeaders.append(
        ${JSON.stringify(parameterModel.name)}, 
        outgoingRequest.parameters.${parameterName} as unknown as string,
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
    const parameterName = toCamel(parameterModel.name);
    const addParameterCode = itt`
      lib.addParameter(
        cookieParameters,
        ${JSON.stringify(parameterModel.name)},
        outgoingRequest.parameters.${parameterName} as unknown as string,
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

    const url = new URL(baseUrl, path);
    let body: BodyInit | null;  
    `;

  if (operationModel.bodies.length === 0) {
    yield* generateRequestContentTypeCodeBody(apiModel, operationModel);
  } else {
    yield itt`  
      switch(outgoingRequest.contentType){
        ${generateRequestContentTypeCaseClauses(apiModel, operationModel)}
      }
    `;
  }

  yield itt`
    const requestInit: RequestInit = {
      headers: requestHeaders,
      method: "PUT",
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
      ${generateResponseStatusCodeCaseClauses(apiModel, operationModel)}
    }
  `;

  yield itt`
    return incomingResponse;
  `;
}

function* generateRequestContentTypeCaseClauses(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  for (const bodyModel of operationModel.bodies) {
    yield itt`
      case ${JSON.stringify(bodyModel.contentType)}: {
        requestHeaders.append("content-type", outgoingRequest.contentType);

        ${generateRequestContentTypeCodeBody(
          apiModel,
          operationModel,
          bodyModel,
        )}
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
    const responseParameters = {
      ${operationResultModel.headerParameters.map((parameterModel) => {
        const parameterName = toCamel(parameterModel.name);
        return `
          ${parameterName}: fetchResponse.headers.get(${JSON.stringify(
            parameterModel.name,
          )}),
        `;
      })}
    } as unknown as shared.${responseParametersName};

    if(validateResponseParameters) {
      if(!shared.${isResponseParametersFunction}(responseParameters)) {
        throw new lib.ClientResponseParameterValidationFailed();
      }
    }
  `;

  if (operationResultModel.bodies.length === 0) {
    yield* generateOperationResultContentTypeBody(apiModel);
    return;
  } else {
    yield itt`
      if (responseContentType == null) {
        throw new lib.MissingClientResponseContentType();
      }

      switch(responseContentType) {
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

function* generateRequestContentTypeCodeBody(
  apiModel: models.Api,
  operationModel: models.Operation,
  bodyModel?: models.Body,
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
        body = lib.toReadableStream(stream);
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
              throw new lib.ClientResponseEntityValidationFailed();
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
          if(validateRequestEntity) {
            entities = lib.mapAsyncIterable(entities, mapAssertEntity);
          }
          stream = lib.serializeJsonEntities(entities);
        }
        else if("entity" in outgoingRequest) {
          let entity = outgoingRequest.entity();
          if(validateRequestEntity) {
            entity = lib.mapPromisable(entity, mapAssertEntity);
          }
          stream = lib.serializeJsonEntity(entity);
        }
        else {
          throw new lib.Unreachable();
        }
        body = lib.toReadableStream(stream);
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
        body = lib.toReadableStream(stream);
      `;
    }
  }
}

function* generateOperationResultContentTypeBody(
  apiModel: models.Api,
  bodyModel?: models.Body,
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
            return lib.deserializeTextLines(stream, signal));
          },
          value() {
            return lib.deserializeTextValue(stream);
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
              throw new lib.ClientResponseEntityValidationFailed();
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
            ) as AsyncIterable<${
              bodyTypeName == null ? "unknown" : `shared.${bodyTypeName}`
            }>;
            if(validateResponseEntity) {
              entities = lib.mapAsyncIterable(entities, mapAssertEntity);
            }
            return entities;
          },
          entity() {
            let entity = lib.deserializeJsonEntity(
              stream
            ) as Promise<${
              bodyTypeName == null ? "unknown" : `shared.${bodyTypeName}`
            }>;
            if(validateResponseEntity) {
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
