import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import { selectBodies } from "../helpers.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationMemberName,
  getEndpointHandlerName,
  getIsBodyFunction,
  getIsOperationAuthenticationName,
  getIsRequestParametersFunction,
  getIsResponseParametersFunction,
  getOperationAcceptConstName,
  getOperationAcceptTypeName,
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getParameterMemberName,
  getParseBodyFunction,
  getParseParameterFunction,
  getRequestParametersTypeName,
} from "../names.js";

export function* generateEndpointHandlerMethod(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const endpointHandlerName = getEndpointHandlerName(operationModel);

  yield itt`
    private ${endpointHandlerName}(
      pathParameters: Record<string, string>,
      serverIncomingRequest: lib.ServerIncomingRequest,
    ): Promise<lib.ServerOutgoingResponse> {
      return this.wrappers.endpoint(async () => {
        ${generateBody(names, apiModel, operationModel, requestTypes, responseTypes)}
      });
    }
  `;
}

/**
 * function statements for route handler
 */
function* generateBody(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationHandlerName = getOperationHandlerName(operationModel);
  const operationHandlerTypeName = getOperationHandlerTypeName(operationModel);
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

  const operationResultModels = operationModel.operationResults;
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;
  const hasAuthenticationArgument = operationModel.authenticationRequirements.length > 0;
  const hasAcceptsArgument = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );

  const hasStatusReturn = operationResultModels.flatMap((model) => model.statusCodes).length > 1;
  const hasParametersReturn = operationResultModels.some(
    (model) => model.headerParameters.length > 0,
  );
  const hasContentTypeReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );
  const hasEntityReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 0,
  );

  yield itt`
    const { 
      validateIncomingEntity,
      validateIncomingParameters,
      validateOutgoingEntity,
      validateOutgoingParameters,
    } = this.configuration;
  `;

  yield itt`
    if(this.operationHandlers.${operationHandlerName} == null) {
      throw new lib.OperationNotImplemented();
    }
  `;

  /**
   * read some headers
   */

  yield itt`
    const cookie =
      lib.getParameterValues(serverIncomingRequest.headers, "cookie");
    const requestContentType =
      lib.first(lib.getParameterValues(serverIncomingRequest.headers, "content-type"));
  `;

  if (hasAcceptsArgument) {
    yield itt`
      const responseAccepts =
        lib.parseAcceptHeader(lib.getParameterValues(serverIncomingRequest.headers, "accept"));
    `;
  }
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

  if (hasAcceptsArgument) {
    /*
  set accept for use in 
  */
    yield itt`
      const accepts = [
        ...lib.intersect(responseAccepts, accept.${operationAcceptConstName}),
      ] as accept.${operationAcceptTypeName}[];
    `;
  }

  if (hasAuthenticationArgument) {
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
  }

  if (hasParametersArgument) {
    /**
     * create the request parameters object
     */

    yield itt`
      const requestParameters = {
        ${[
          ...operationModel.pathParameters.map((parameterModel) => {
            const parameterName = getParameterMemberName(parameterModel);
            const parseParameterFunction = getParseParameterFunction(names, parameterModel);

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
            const parseParameterFunction = getParseParameterFunction(names, parameterModel);

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
            const parseParameterFunction = getParseParameterFunction(names, parameterModel);

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
            const parseParameterFunction = getParseParameterFunction(names, parameterModel);

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
      } as $parameters.${requestParametersName};

      if(validateIncomingParameters) {
        if(!$parameters.${isRequestParametersFunction}(requestParameters)) {
          const lastError = $parameters.getLastParameterValidationError();
          throw new lib.ServerRequestParameterValidationFailed(
            lastError.parameterName,
            lastError.path,
            lastError.rule
          );
        }
      }
    `;
  }

  /**
   * now lets construct the incoming request object, this object will be
   * passed to the operation handler later
   */

  if (hasEntityArgument) {
    yield itt`
      let requestEntity;

      if(requestContentType == null) {
        throw new lib.ServerRequestMissingContentType();
      }

      switch(requestContentType) {
        ${generateRequestContentTypeCodeCaseClauses()};
      }
    `;
  }

  /**
   * execute the operation handler and collect the response
   */

  const functionCallArguments = new Array<string>();
  if (hasParametersArgument) {
    functionCallArguments.push("requestParameters");
  }
  if (hasContentTypeArgument) {
    functionCallArguments.push("requestContentType");
  }
  if (hasEntityArgument) {
    functionCallArguments.push("requestEntity");
  }
  if (hasAuthenticationArgument) {
    functionCallArguments.push("authentication");
  }
  if (hasAcceptsArgument) {
    functionCallArguments.push("accepts");
  }

  const functionReturnArguments = new Array<string>();
  if (hasStatusReturn) {
    functionReturnArguments.push(`status`);
  }
  if (hasParametersReturn) {
    functionReturnArguments.push(`responseParameters`);
  }
  if (hasContentTypeReturn) {
    functionReturnArguments.push(`responseContentType`);
  }
  if (hasEntityReturn) {
    functionReturnArguments.push(`responseEntity`);
  }

  switch (functionReturnArguments.length) {
    case 0: {
      yield itt`
        await this.operationHandlers.${operationHandlerName}(
          ...[
            ${functionCallArguments.map((argument) => itt`${argument},\n`)}
          ] as Parameters<${operationHandlerTypeName}<A>>
        );
      `;
      break;
    }
    case 1: {
      const [argument] = functionReturnArguments as [string];
      yield itt`
        const ${argument} = await this.operationHandlers.${operationHandlerName}(
          ...[
            ${functionCallArguments.map((argument) => itt`${argument},\n`)}
          ] as Parameters<${operationHandlerTypeName}<A>>
        );
      `;
      break;
    }
    default: {
      yield itt`
        const [${functionReturnArguments.map((argument) => itt`${argument},\n`)}] = await this.operationHandlers.${operationHandlerName}(
          ...[
            ${functionCallArguments.map((argument) => itt`${argument},\n`)}
          ] as Parameters<${operationHandlerTypeName}<A>>
        );
      `;
    }
  }

  if (!hasStatusReturn) {
    if (operationResultModels.length === 1) {
      const [operationResultModel] = operationResultModels as [skiffaCore.OperationResultContainer];
      if (operationResultModel.statusCodes.length === 1) {
        const [statusCode] = [...operationResultModel.statusCodes] as [number];
        yield itt`
          const status = ${JSON.stringify(statusCode)};
        `;
      }
    }
  }

  yield itt`
    let serverOutgoingResponse: lib.ServerOutgoingResponse;
    `;

  switch (operationResultModels.length) {
    case 0: {
      yield itt`
        throw new lib.Unreachable();
      `;
      break;
    }
    case 1: {
      const [operationResultModel] = operationResultModels as [skiffaCore.OperationResultContainer];
      yield generateOperationResultBody(operationResultModel);
      break;
    }

    default: {
      yield itt`
        switch(status) {
          ${generateStatusCodeCaseClauses()}
        }
      `;
    }
  }

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
                  lib.first(lib.getParameterValues(queryParameters, ${JSON.stringify(authenticationModel.parameterName)})),
              `;
              break;
            }

            case "header": {
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.first(lib.getParameterValues(serverIncomingRequest.headers, ${JSON.stringify(authenticationModel.parameterName)})),
              `;
              break;
            }

            case "cookie": {
              yield itt`
                ${getAuthenticationMemberName(authenticationModel)}:
                  lib.first(lib.getParameterValues(cookieParameters, ${JSON.stringify(authenticationModel.parameterName)})),
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

        case "oauth2": {
          // WARN
          yield itt`
            ${getAuthenticationMemberName(authenticationModel)}: undefined,
          `;
          break;
        }

        case "openIdConnect": {
          // WARN
          yield itt`
            ${getAuthenticationMemberName(authenticationModel)}: undefined,
          `;
          break;
        }

        default: {
          throw "impossible";
        }
      }
    }
  }

  function* generateRequestContentTypeCodeCaseClauses() {
    const requestBodyModels = selectBodies(operationModel, requestTypes);

    for (const bodyModel of requestBodyModels) {
      yield itt`
      case ${JSON.stringify(bodyModel.contentType)}:
      {
        ${generateRequestContentTypeCodeBody(bodyModel)}
        break;
      }
    `;
    }
    yield itt`
    default:
      throw new lib.ServerRequestUnexpectedContentType();
  `;
  }

  function* generateRequestContentTypeCodeBody(bodyModel: skiffaCore.BodyContainer) {
    switch (bodyModel.contentType) {
      case "application/x-ndjson": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

        if (isBodyTypeFunction == null) {
          yield itt`
            requestEntity = async function* (signal) {
              let entities = lib.deserializeNdjsonEntities(
                serverIncomingRequest.stream,
                signal,
              ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
              yield* entities;
            };
          `;
        } else {
          yield itt`
            requestEntity = async function* (signal) {
              let entities = lib.deserializeNdjsonEntities(
                serverIncomingRequest.stream,
                signal,
              ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
              if(validateIncomingEntity) {
                for await(const entity of entities) {
                  if(!validators.${isBodyTypeFunction}(entity)) {
                    const lastError = validators.getLastValidationError();
                    throw new lib.ServerRequestEntityValidationFailed(
                      lastError.path,
                      lastError.rule,
                    );
                  }
                  yield entity;
                }
              }
              else {
                yield* entities;
              }
              return entities;
            };
          `;
        }

        break;
      }

      case "application/json": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

        yield itt`
          requestEntity = await lib.deserializeJsonEntity(
            serverIncomingRequest.stream
          ) as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
        `;

        if (isBodyTypeFunction != null) {
          yield itt`
            if(validateIncomingEntity) {
              if(!validators.${isBodyTypeFunction}(requestEntity)) {
                const lastError = validators.getLastValidationError();
                throw new lib.ServerRequestEntityValidationFailed(
                  lastError.path,
                  lastError.rule,
                );
              }
            }
          `;
        }
        break;
      }

      case "text/plain": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);
        const parseBodyFunction = getParseBodyFunction(names, bodyModel);

        if (parseBodyFunction == null) {
          yield itt`
            requestEntity = await lib.deserializeTextValue(serverIncomingRequest.stream) as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
          `;
        } else {
          yield itt`
            requestEntity = parsers.${parseBodyFunction}(await lib.deserializeTextValue(serverIncomingRequest.stream)) as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
          `;
        }

        if (isBodyTypeFunction != null) {
          yield itt`
            if(validateIncomingEntity) {
              if(!validators.${isBodyTypeFunction}(requestEntity)) {
                const lastError = validators.getLastValidationError();
                throw new lib.ServerRequestEntityValidationFailed(
                  lastError.path,
                  lastError.rule,
                );
              }
            }
          `;
        }
        break;
      }

      default: {
        yield itt`
          requestEntity = async function* (signal){
            yield* serverIncomingRequest.stream(signal);
          };
        `;
      }
    }
  }

  function* generateStatusCodeCaseClauses() {
    for (const operationResultModel of operationModel.operationResults) {
      const statusCodes = [...operationResultModel.statusCodes];
      let statusCode;
      while ((statusCode = statusCodes.shift()) != null) {
        yield itt`case ${JSON.stringify(statusCode)}:`;
        // it's te last one!
        if (statusCodes.length === 0) {
          yield itt`
            {
              ${generateOperationResultBody(operationResultModel)}
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

  function* generateOperationResultBody(operationResultModel: skiffaCore.OperationResultContainer) {
    if (hasParametersReturn) {
      const isResponseParametersFunction = getIsResponseParametersFunction(
        operationModel,
        operationResultModel,
      );

      yield itt`
        if(validateOutgoingParameters) {
          if(!$parameters.${isResponseParametersFunction}(responseParameters ?? {})) {
            const lastError = $parameters.getLastParameterValidationError();
            throw new lib.ServerResponseParameterValidationFailed(
              lastError.parameterName,
              lastError.path,
              lastError.rule,
            );
          }
        }
      `;
    }

    yield itt`
      const responseHeaders = {};
    `;

    for (const parameterModel of operationResultModel.headerParameters) {
      const parameterName = getParameterMemberName(parameterModel);

      const addParameterCode = itt`
        lib.addParameter(
          responseHeaders,
          ${JSON.stringify(parameterModel.name)},
          responseParameters.${parameterName}.toString(),
        );
      `;

      if (parameterModel.required) {
        yield addParameterCode;
      } else {
        yield itt`
          if (responseParameters.${parameterName} !== undefined) {
            ${addParameterCode}    
          }
        `;
      }
    }

    const responseBodyModels = selectBodies(operationResultModel, responseTypes);

    switch (responseBodyModels.length) {
      case 0: {
        yield generateOperationResultContentTypeBody();
        break;
      }
      case 1: {
        const [responseBodyModel] = responseBodyModels as [skiffaCore.BodyContainer];
        yield generateOperationResultContentTypeBody(responseBodyModel);
        break;
      }
      default: {
        yield itt`
          switch(responseContentType) {
            ${generateOperationResultContentTypeCaseClauses(operationResultModel)}
          }
        `;
        break;
      }
    }
  }

  function* generateOperationResultContentTypeCaseClauses(
    operationResultModel: skiffaCore.OperationResultContainer,
  ) {
    const responseBodyModels = selectBodies(operationResultModel, responseTypes);

    for (const bodyModel of responseBodyModels) {
      yield itt`
        case ${JSON.stringify(bodyModel.contentType)}:
        {
          ${generateOperationResultContentTypeBody(bodyModel)}
          break;
        }
      `;
    }

    yield itt`
      default:
        throw new lib.Unreachable();       
    `;
  }

  function* generateOperationResultContentTypeBody(bodyModel?: skiffaCore.BodyContainer) {
    if (bodyModel == null) {
      yield itt`
        serverOutgoingResponse = {
          status,
          headers: responseHeaders,
        }    
      `;
      return;
    }

    yield itt`
      lib.addParameter(responseHeaders, "content-type", ${JSON.stringify(bodyModel.contentType)});
    `;
    switch (bodyModel.contentType) {
      case "application/x-ndjson": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

        if (isBodyTypeFunction == null) {
          yield itt`
            serverOutgoingResponse = {
              status,
              headers: responseHeaders,
              async *stream(signal) {
                const entities = responseEntity(signal);
                yield* lib.serializeNdjsonEntities(entities);
              },
            }
          `;
        } else {
          yield itt`
            serverOutgoingResponse = {
              status,
              headers: responseHeaders,
              async *stream(signal) {
                const entities = responseEntity(signal);
                if(validateOutgoingEntity) {
                  lib.serializeNdjsonEntities((async function* () {
                    for await(const entity of entities) {
                      if(!validators.${isBodyTypeFunction}(entity)) {
                        const lastError = validators.getLastValidationError();
                        throw new lib.ServerResponseEntityValidationFailed(
                          lastError.path,
                          lastError.rule,
                        );
                      }
                      yield entity;
                    }
                  })());
                }
                else {
                  yield* lib.serializeNdjsonEntities(entities);
                }
              },
            }
          `;
        }

        break;
      }

      case "application/json": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

        if (isBodyTypeFunction != null) {
          yield itt`
            if(validateOutgoingEntity) {
              if(!validators.${isBodyTypeFunction}(responseEntity)) {
                const lastError = validators.getLastValidationError();
                throw new lib.ServerResponseEntityValidationFailed(
                  lastError.path,
                  lastError.rule,
                );
              }
            }
          `;
        }

        yield itt`
          serverOutgoingResponse = {
            status,
            headers: responseHeaders,
            async *stream(signal) {
              yield* lib.serializeJsonEntity(responseEntity);
            },
          }
        `;
        break;
      }

      case "text/plain": {
        const bodySchemaId = bodyModel.schemaId;
        const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
        const isBodyTypeFunction = bodyTypeName == null ? bodyTypeName : "is" + bodyTypeName;

        if (isBodyTypeFunction != null) {
          yield itt`
            if(validateOutgoingEntity) {
              if(!validators.${isBodyTypeFunction}(responseEntity)) {
                const lastError = validators.getLastValidationError();
                throw new lib.ServerResponseEntityValidationFailed(
                  lastError.path,
                  lastError.rule,
                );
              }
            }
          `;
        }

        yield itt`
          serverOutgoingResponse = {
            status,
            headers: responseHeaders,
            async *stream(signal) {
              yield* lib.serializeTextValue(String(responseEntity));
            },
          }
        `;
        break;
      }

      default: {
        yield itt`
          serverOutgoingResponse = {
            status,
            headers: responseHeaders,
            stream: responseEntity,
          }
        `;
      }
    }
  }
}
