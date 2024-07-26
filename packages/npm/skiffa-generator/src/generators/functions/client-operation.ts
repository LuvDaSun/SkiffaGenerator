import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import { selectBodies } from "../helpers.js";
import {
  getAuthenticationMemberName,
  getIsBodyFunction,
  getIsRequestParametersFunction,
  getIsResponseParametersFunction,
  getOperationAcceptConstName,
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getParameterMemberName,
  getParseBodyFunction,
  getParseParameterFunction,
  getRequestParametersTypeName,
  getResponseParametersTypeName,
} from "../names.js";

/**
 * Generates code for the facade (aka simple client). These functions call the advanced client.
 * These functions make it a bit easier to work with the API.
 *
 * The first argument of the function is the request parameters. These may be omitted if there
 * are no request parameters.
 *
 * The second argument is the request content type. If there is only one request content type,
 * this is omitted.
 *
 * The third argument is the request body. In case of json this is the entity, in case of text
 * this is the text value.
 *
 * And then there is an optional argument for credentials and configuration. These can also be
 * set globally and probably never have to be passed to the function.
 *
 * The generated function may return a tuple.
 *
 * The first field of the tuple is the statusCode, this field is only there if multiple
 * statusCodes are possible in the 200 - 300 range.
 *
 * The next field is the return parameters (headers). May be omitted if parameters are empty.
 *
 * The third field is the response content type. It is only available is there is at least one
 * response with a status code in the 200 - 300 range that has multiple content types.
 *
 * The last field is the body of the response. This may be omitted if none of the status codes
 * result in a response with a body.
 *
 * If the tuple is only one field, then we do not return the tuple, but only the field
 */

export function* generateClientOperationFunction(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationFunctionName = getOperationFunctionName(operationModel);
  const credentialsName = getOperationCredentialsTypeName(operationModel);

  const jsDoc = [
    operationModel.deprecated ? "@deprecated" : "",
    operationModel.summary ?? "",
    operationModel.description ?? "",
  ]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  const operationResultModels = operationModel.operationResults.filter((operationResultModel) =>
    operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );
  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;

  const hasStatusReturn = operationResultModels.length > 1;
  const hasParametersReturn = operationResultModels.some(
    (model) => model.headerParameters.length > 0,
  );
  const hasContentTypeReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 1,
  );
  const hasEntityReturn = operationResultModels.some(
    (model) => selectBodies(model, responseTypes).length > 0,
  );

  if (requestBodyModels.length > 1) {
    for (const requestBodyModel of requestBodyModels) {
      yield* generateFunctionSignature(requestBodyModel);
    }
  }

  yield* generateFunctionImplementation();

  function* generateFunctionSignature(requestBodyModel: skiffaCore.BodyContainer) {
    const requestEntityTypeName =
      requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];

    const functionArguments = new Array<[string, string]>();

    if (hasParametersArgument) {
      const parametersTypeName = getRequestParametersTypeName(operationModel);
      functionArguments.push(["parameters", `$parameters.${parametersTypeName}`]);
    }

    if (hasContentTypeArgument) {
      functionArguments.push([
        "contentType",
        JSON.stringify(requestBodyModel?.contentType ?? null),
      ]);
    }

    if (hasEntityArgument) {
      functionArguments.push([
        "entity",
        requestBodyModel == null
          ? "undefined"
          : requestEntityTypeName == null
            ? "unknown"
            : `types.${requestEntityTypeName}`,
      ]);
    }

    functionArguments.push([
      "configurationOptions?",
      `Partial<ClientConfiguration & ${credentialsName}>`,
    ]);

    yield itt`
        /**
          ${jsDoc}
        */
        export function ${operationFunctionName}(
          ${functionArguments.map(([name, type]) => `${name}: ${type},\n`).join("")}
        ): Promise<${generateFunctionReturnType()}>;
      `;
  }

  function* generateFunctionImplementation() {
    const functionArguments = new Array<[string, string]>();

    if (hasParametersArgument) {
      const parametersTypeName = getRequestParametersTypeName(operationModel);
      functionArguments.push(["parameters", `$parameters.${parametersTypeName}`]);
    }

    if (hasContentTypeArgument) {
      functionArguments.push([
        "contentType",
        requestBodyModels
          .map((model) => model.contentType)
          .map((value) => JSON.stringify(value))
          .join(" | "),
      ]);
    }

    if (hasEntityArgument) {
      functionArguments.push([
        "entity",
        requestBodyModels
          .map((requestBodyModel) => {
            const requestEntityTypeName =
              requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];

            return requestBodyModel == null
              ? "undefined"
              : requestEntityTypeName == null
                ? "unknown"
                : `types.${requestEntityTypeName}`;
          })
          .join(" | "),
      ]);
    }

    functionArguments.push([
      "configurationOptions",
      `Partial<ClientConfiguration & ${credentialsName}> = {}`,
    ]);

    yield itt`
      /**
        ${jsDoc}
      */
      export async function ${operationFunctionName}(
        ${functionArguments.map(([name, type]) => `${name}: ${type},\n`).join("")}
      ): Promise<${generateFunctionReturnType()}> {
        ${generateFunctionBody()}
      }
    `;
  }

  function* generateFunctionReturnType() {
    switch (operationResultModels.length) {
      case 0: {
        // no operation result
        yield "never";
        break;
      }
      default: {
        // one or multiple operation results
        let index = 0;
        for (const operationResultModel of operationResultModels) {
          if (index > 0) {
            yield " | ";
          }
          yield generateOperationResultReturnType(operationResultModel);
          index++;
        }
        break;
      }
    }
  }

  function* generateOperationResultReturnType(
    operationResultModel: skiffaCore.OperationResultContainer,
  ) {
    const responseBodyModels = selectBodies(operationResultModel, responseTypes);

    switch (responseBodyModels.length) {
      case 0: {
        //  no response body
        yield generateResponseBodyReturnType(operationResultModel, null);
        break;
      }
      default: {
        // one or multiple response bodies
        let index = 0;
        for (const responseBodyModel of responseBodyModels) {
          if (index > 0) {
            yield " | ";
          }
          yield generateResponseBodyReturnType(operationResultModel, responseBodyModel);
          index++;
        }
        break;
      }
    }
  }

  function* generateResponseBodyReturnType(
    operationResultModel: skiffaCore.OperationResultContainer,
    responseBodyModel: skiffaCore.BodyContainer | null,
  ) {
    const responseEntityTypeName =
      responseBodyModel?.schemaId == null ? null : names[responseBodyModel.schemaId];
    const isStream = responseBodyModel?.contentType === "application/x-ndjson";

    const tuple = new Array<[string, string]>();

    if (hasStatusReturn) {
      tuple.push([
        "status",
        [...operationResultModel.statusCodes]
          .filter((statusCode) => statusCode >= 200 && statusCode < 300)
          .map((value) => JSON.stringify(value))
          .join(" | "),
      ]);
    }

    if (hasParametersReturn) {
      const parametersTypeName = getResponseParametersTypeName(
        operationModel,
        operationResultModel,
      );
      tuple.push(["parameters", `$parameters.${parametersTypeName}`]);
    }

    if (hasContentTypeReturn) {
      tuple.push(["contentType", JSON.stringify(responseBodyModel?.contentType ?? null)]);
    }

    if (hasEntityReturn) {
      tuple.push([
        "entity",
        responseBodyModel == null
          ? "undefined"
          : responseEntityTypeName == null
            ? isStream
              ? "(signal: AbortSignal) => AsyncIterable<unknown>"
              : "unknown"
            : isStream
              ? `(signal: AbortSignal) => AsyncIterable<types.${responseEntityTypeName}>`
              : `types.${responseEntityTypeName}`,
      ]);
    }

    switch (tuple.length) {
      case 0:
        yield "void";
        break;

      case 1:
        const [[_name, type]] = tuple as [[string, string]];
        yield type;
        break;

      default:
        yield `[
          ${tuple.map(([name, type]) => `${name}: ${type},\n`).join("")}
        ]`;
        break;
    }
  }

  function* generateFunctionBody() {
    const requestBodyModels = selectBodies(operationModel, requestTypes);
    const isRequestParametersFunction = getIsRequestParametersFunction(operationModel);
    const operationAcceptConstName = getOperationAcceptConstName(operationModel);

    // first we setup some variables so we can work with them alter

    yield itt`
      const configuration = {
        ...defaultClientConfiguration,
        ...configurationOptions,
      };
    `;

    yield itt`
      if(configuration.baseUrl == null) {
        throw new Error("please set baseUrl");
      }
    `;

    // lets fill some request parameters

    yield itt`
      const pathParameters = {};
      const queryParameters = {};
      const requestHeaders = new Headers();
      const cookieParameters = {};
    `;

    // if there are no parameters, then we

    if (hasParametersArgument) {
      yield itt`
        if(configuration.validateOutgoingParameters) {
          if(!$parameters.${isRequestParametersFunction}(parameters)) {
            const lastError = $parameters.getLastParameterValidationError();
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
            parameters.${parameterName} == null ? "" : String(parameters.${parameterName}),
          );
        `;

        if (parameterModel.required) {
          yield addParameterCode;
        } else {
          yield itt`
            if (parameters.${parameterName} !== undefined) {
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
            parameters.${parameterName} == null ? "" : String(parameters.${parameterName}),
          );
        `;

        if (parameterModel.required) {
          yield addParameterCode;
        } else {
          yield itt`
            if (parameters.${parameterName} !== undefined) {
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
            parameters.${parameterName} == null ? "" : String(parameters.${parameterName}),
          );
        `;

        if (parameterModel.required) {
          yield addParameterCode;
        } else {
          yield itt`
            if (parameters.${parameterName} !== undefined) {
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
            parameters.${parameterName} == null ? "" : String(parameters.${parameterName}),
          );
        `;

        if (parameterModel.required) {
          yield addParameterCode;
        } else {
          yield itt`
            if (parameters.${parameterName} !== undefined) {
              ${addParameterCode}    
            }
          `;
        }
      }
    }

    // setup authentication for this operation

    {
      const authenticationNames = new Set(
        operationModel.authenticationRequirements.flatMap((group) =>
          group.requirements.map((requirement) => requirement.authenticationName),
        ),
      );
      const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
        authenticationNames.has(authenticationModel.name),
      );

      for (const authenticationModel of authenticationModels) {
        // TODO this should be in a function or something, it's dirty!
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
    }

    // prepare path and headers for the actual request

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

      requestHeaders.append("accept", lib.stringifyAcceptHeader(accept.${operationAcceptConstName}));

      const url = new URL(path, configuration.baseUrl);
      let body: BodyInit | null;  
    `;

    // prepare entity for the request

    switch (requestBodyModels.length) {
      case 0: {
        // empty request
        yield* generateRequestContentTypeCodeBody();
        break;
      }
      case 1: {
        const [requestBodyModel] = requestBodyModels as [skiffaCore.BodyContainer];
        yield* generateRequestContentTypeCodeBody(requestBodyModel);
        break;
      }
      default: {
        yield itt`  
          switch(contentType){
            ${generateRequestContentTypeCaseClauses()}
          }
        `;
      }
    }

    function* generateRequestContentTypeCaseClauses() {
      for (const bodyModel of requestBodyModels) {
        yield itt`
          case ${JSON.stringify(bodyModel.contentType)}: {
            requestHeaders.append("content-type", ${JSON.stringify(bodyModel.contentType)});
    
            ${generateRequestContentTypeCodeBody(bodyModel)}

            break;
          }
        `;
      }

      yield itt`
        default:
          throw new lib.Unreachable();
      `;
    }

    function* generateRequestContentTypeCodeBody(bodyModel?: skiffaCore.BodyContainer) {
      if (bodyModel == null) {
        yield itt`
          body = null;
        `;
        return;
      }

      switch (bodyModel.contentType) {
        case "application/json": {
          const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

          if (isBodyTypeFunction != null) {
            yield itt`
              if(configuration.validateOutgoingEntity) {
                if(!validators.${isBodyTypeFunction}(entity)) {
                  const lastError = validators.getLastValidationError();
                  throw new lib.ClientResponseEntityValidationFailed(
                    lastError.path,
                    lastError.rule,
                  );
                }
              }
            `;
          }

          yield itt`
            const stream = lib.serializeJsonEntity(entity);
            body = await lib.collectStream(stream);
          `;

          break;
        }

        case "text/plain": {
          const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

          if (isBodyTypeFunction != null) {
            yield itt`
              if(configuration.validateOutgoingEntity) {
                if(!validators.${isBodyTypeFunction}(entity)) {
                  const lastError = validators.getLastValidationError();
                  throw new lib.ClientResponseEntityValidationFailed(
                    lastError.path,
                    lastError.rule,
                  );
                }
              }
            `;
          }

          yield itt`
            const stream = lib.serializeTextValue(String(entity));
            body = await lib.collectStream(stream);
          `;

          break;
        }

        default: {
          yield itt`
            const stream = body(undefined);
            body = await lib.collectStream(stream);
          `;

          yield itt`
            break;
          `;
        }
      }
    }

    // do the actual request

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
    `;

    // and handle the response

    yield itt`
      switch(fetchResponse.status) {
        ${generateResponseStatusCodeCaseClauses()}
      }
    `;

    function* generateResponseStatusCodeCaseClauses() {
      for (const operationResultModel of operationModel.operationResults) {
        const statusCodes = [...operationResultModel.statusCodes].filter(
          (statusCode) => statusCode >= 200 && statusCode < 300,
        );
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
          throw new lib.UnexpectedStatusCode(fetchResponse.status)  
      `;
    }

    function* generateOperationResultBody(
      operationResultModel: skiffaCore.OperationResultContainer,
    ) {
      const responseParametersName = getResponseParametersTypeName(
        operationModel,
        operationResultModel,
      );
      const isResponseParametersFunction = getIsResponseParametersFunction(
        operationModel,
        operationResultModel,
      );

      if (hasParametersReturn) {
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
        } as $parameters.${responseParametersName};
    
        if(configuration.validateIncomingParameters) {
          if(!$parameters.${isResponseParametersFunction}(responseParameters)) {
            const lastError = $parameters.getLastParameterValidationError();
            throw new lib.ClientResponseParameterValidationFailed(
              lastError.parameterName,
              lastError.path,
              lastError.rule,
            );
          }
        }
      `;
      }

      const responseBodyModels = selectBodies(operationResultModel, responseTypes);

      switch (responseBodyModels.length) {
        case 0: {
          yield* generateOperationResultContentTypeBody();
          break;
        }

        default: {
          yield itt`
            if (responseContentType == null) {
              throw new lib.ClientResponseMissingContentType();
            }
          `;

          yield itt`
            switch(responseContentType) {
              ${generateOperationResultContentTypeCaseClauses(operationResultModel)}
            }
          `;
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
          throw new lib.ClientResponseUnexpectedContentType();       
      `;
    }

    function* generateOperationResultContentTypeBody(bodyModel?: skiffaCore.BodyContainer) {
      const returnArguments = new Array<string>();

      if (hasStatusReturn) {
        returnArguments.push(`fetchResponse.status`);
      }

      if (hasParametersReturn) {
        returnArguments.push(`responseParameters`);
      }

      if (hasContentTypeReturn) {
        returnArguments.push(`responseContentType`);
      }

      if (hasEntityReturn) {
        if (bodyModel == null) {
          returnArguments.push(`undefined`);
        } else {
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
              const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

              if (isBodyTypeFunction == null) {
                yield itt`
                  async function* resultEntityGenerator(signal: AbortSignal) {
                    const entityIterable = lib.deserializeNdjsonEntities(
                      stream,
                      signal,
                    ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
                    yield* entityIterable;
                  }
                `;
              } else {
                yield itt`
                  async function* resultEntityGenerator(signal: AbortSignal) {
                    const entityIterable = lib.deserializeNdjsonEntities(
                      stream,
                      signal,
                    ) as AsyncIterable<${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`}>;
                    if(configuration.validateIncomingEntity) {
                      for await(const entity of entityIterable) {
                        if(!validators.${isBodyTypeFunction}(entity)) {
                          const lastError = validators.getLastValidationError();
                          throw new lib.ClientResponseEntityValidationFailed(
                            lastError.path,
                            lastError.rule,
                          );
                        }
                        yield entity;
                      }
                    }
                    else {
                      yield* entityIterable;
                    }
                  }
                `;
              }

              returnArguments.push(`resultEntityGenerator`);
              break;
            }

            case "application/json": {
              const bodySchemaId = bodyModel.schemaId;
              const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
              const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);

              yield itt`
                const resultEntity = await lib.deserializeJsonEntity(
                  stream
                ) as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
  
              `;

              if (isBodyTypeFunction != null) {
                yield itt`
                  if(configuration.validateIncomingEntity) {
                    if(!validators.${isBodyTypeFunction}(resultEntity)) {
                      const lastError = validators.getLastValidationError();
                      throw new lib.ClientResponseEntityValidationFailed(
                        lastError.path,
                        lastError.rule,
                      );
                    }
                  }
                `;
              }

              returnArguments.push(`resultEntity`);
              break;
            }

            case "text/plain": {
              const bodySchemaId = bodyModel.schemaId;
              const bodyTypeName = bodySchemaId == null ? bodySchemaId : names[bodySchemaId];
              const isBodyTypeFunction = getIsBodyFunction(names, bodyModel);
              const parseBodyFunction = getParseBodyFunction(names, bodyModel);

              yield itt`
                const resultText = await lib.deserializeTextValue(stream);
                const resultEntity = ${
                  parseBodyFunction == null
                    ? "resultText"
                    : `parsers.${parseBodyFunction}(resultText)`
                } as ${bodyTypeName == null ? "unknown" : `types.${bodyTypeName}`};
              `;

              if (isBodyTypeFunction != null) {
                yield itt`
                  if(configuration.validateIncomingEntity) {
                    if(!validators.${isBodyTypeFunction}(resultEntity)) {
                      const lastError = validators.getLastValidationError();
                      throw new lib.ClientResponseEntityValidationFailed(
                        lastError.path,
                        lastError.rule,
                      );
                    }
                  }
                `;
              }

              returnArguments.push(`resultEntity`);
              break;
            }

            default: {
              returnArguments.push(`stream`);
            }
          }
        }
      }

      switch (returnArguments.length) {
        case 0: {
          yield itt`
            return;
          `;
          break;
        }

        case 1: {
          const [returnArgument] = returnArguments as [string];
          yield itt`
            return ${returnArgument};
          `;
          break;
        }

        default: {
          yield itt`
            return [${returnArguments.map((arg) => `${arg},\n`).join("")}];
          `;
          break;
        }
      }
    }
  }
}
