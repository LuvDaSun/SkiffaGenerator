import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import { selectBodies } from "../helpers.js";
import {
  getAuthenticationMemberName,
  getIsRequestParametersFunction,
  getOperationAcceptConstName,
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getOutgoingRequestTypeName,
  getParameterMemberName,
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

export function* generateFacadeOperationFunction(
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
      const requestEntityTypeName =
        requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];

      const functionArguments = new Array<string>();

      if (hasParametersArgument) {
        const parametersTypeName = getRequestParametersTypeName(operationModel);
        functionArguments.push(`parameters: parameters.${parametersTypeName}`);
      }

      if (hasContentTypeArgument) {
        functionArguments.push(
          `contentType: ${JSON.stringify(requestBodyModel?.contentType ?? null)}`,
        );
      }

      if (hasEntityArgument) {
        functionArguments.push(
          `entity: ${
            requestBodyModel == null
              ? "undefined"
              : requestEntityTypeName == null
                ? "unknown"
                : `types.${requestEntityTypeName}`
          }`,
        );
      }

      functionArguments.push(
        `configurationOptions?: Partial<client.ClientConfiguration & client.${credentialsName}>`,
      );

      yield itt`
        /**
          ${jsDoc}
        */
        export function ${operationFunctionName}(
          ${functionArguments.map((element) => `${element},\n`).join("")}
        ): Promise<${generateOperationReturnType()}>;
      `;
    }
  }

  {
    const functionArguments = new Array<string>();

    if (hasParametersArgument) {
      const parametersTypeName = getRequestParametersTypeName(operationModel);
      functionArguments.push(`parameters: parameters.${parametersTypeName}`);
    }

    if (hasContentTypeArgument) {
      functionArguments.push(
        `contentType: ${requestBodyModels
          .map((model) => model.contentType)
          .map((value) => JSON.stringify(value))
          .join(" | ")}`,
      );
    }

    if (hasEntityArgument) {
      functionArguments.push(
        `entity: ${requestBodyModels
          .map((requestBodyModel) => {
            const requestEntityTypeName =
              requestBodyModel?.schemaId == null ? null : names[requestBodyModel.schemaId];

            return requestBodyModel == null
              ? "undefined"
              : requestEntityTypeName == null
                ? "unknown"
                : `types.${requestEntityTypeName}`;
          })
          .join(" | ")}`,
      );
    }

    functionArguments.push(
      `configurationOptions: Partial<client.ClientConfiguration & client.${credentialsName}> = {}`,
    );

    yield itt`
      /**
        ${jsDoc}
      */
      export async function ${operationFunctionName}(
        ${functionArguments.map((element) => `${element},\n`).join("")}
      ): Promise<${generateOperationReturnType()}> {
        ${generateBody()}
      }
    `;
  }

  function* generateOperationReturnType() {
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

    const tuple = new Array<string>();

    if (hasStatusReturn) {
      tuple.push(
        [...operationResultModel.statusCodes]
          .filter((statusCode) => statusCode >= 200 && statusCode < 300)
          .map((value) => JSON.stringify(value))
          .join(" | "),
      );
    }

    if (hasParametersReturn) {
      const parametersTypeName = getResponseParametersTypeName(
        operationModel,
        operationResultModel,
      );
      tuple.push(`parameters.${parametersTypeName}`);
    }

    if (hasContentTypeReturn) {
      tuple.push(JSON.stringify(responseBodyModel?.contentType ?? null));
    }

    if (hasEntityReturn) {
      tuple.push(
        responseBodyModel == null
          ? "undefined"
          : responseEntityTypeName == null
            ? isStream
              ? "(signal: AbortSignal) => AsyncIterable<unknown>"
              : "Promise<unknown>"
            : isStream
              ? `(signal: AbortSignal) => AsyncIterable<types.${responseEntityTypeName}>`
              : `Promise<types.${responseEntityTypeName}>`,
      );
    }

    switch (tuple.length) {
      case 0:
        yield "void";
        break;

      case 1:
        const [element] = tuple;
        yield element;
        break;

      default:
        yield `[
          ${tuple.map((element) => `${element},\n`).join("")}
        ]`;
        break;
    }
  }

  function* generateBody() {
    const operationFunctionName = getOperationFunctionName(operationModel);
    const requestBodyModels = selectBodies(operationModel, requestTypes);
    const defaultRequestBodyModel = requestBodyModels.length === 1 ? requestBodyModels[0] : null;
    const operationOutgoingRequestName = getOutgoingRequestTypeName(operationModel);
    const isRequestParametersFunction = getIsRequestParametersFunction(operationModel);
    const operationAcceptConstName = getOperationAcceptConstName(operationModel);

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

    yield itt`
    const pathParameters = {};
    const queryParameters = {};
    const requestHeaders = new Headers();
    const cookieParameters = {};
  `;

    if (hasParametersArgument) {
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

    yield itt`
      const result = await client.${operationFunctionName}(
        {
          ${hasParametersArgument ? "parameters" : "parameters: {}"},
          ${hasContentTypeArgument ? "contentType" : `contentType: ${JSON.stringify(defaultRequestBodyModel?.contentType ?? null)}`},
          ${hasEntityArgument ? "entity: async () => entity," : ""}
        } as client.${operationOutgoingRequestName},
        configuration,
      );
    `;

    yield itt`
      switch(result.status) {
        ${generateStatusCodesCaseClauses(operationModel)}
      }
    `;
  }

  function* generateStatusCodesCaseClauses(operationModel: skiffaCore.OperationContainer) {
    for (const operationResultModel of operationModel.operationResults) {
      {
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
              ${generateStatusCodeCaseBody(operationResultModel)}
              break;
            }
          `;
          }
        }
      }
      {
        const statusCodes = [...operationResultModel.statusCodes].filter(
          (statusCode) => !(statusCode >= 200 && statusCode < 300),
        );
        let statusCode;
        while ((statusCode = statusCodes.shift()) != null) {
          yield itt`case ${JSON.stringify(statusCode)}:`;
          // it's te last one!
          if (statusCodes.length === 0) {
            yield itt`
              throw new lib.UnexpectedStatusCode(result.status);
            `;
          }
        }
      }
    }

    yield itt`
      default:
        throw "cannot happen"
    `;
  }

  function* generateStatusCodeCaseBody(operationResultModel: skiffaCore.OperationResultContainer) {
    const responseBodyModels = selectBodies(operationResultModel, responseTypes);
    switch (responseBodyModels.length) {
      case 0: {
        yield generateContentReturnStatement(null);
      }
      default: {
        yield itt`
          switch(result.contentType) {
            ${generateContentTypesCaseClauses(responseBodyModels)}
          }
        `;
        break;
      }
    }
  }

  function* generateContentTypesCaseClauses(responseBodyModels: Array<skiffaCore.BodyContainer>) {
    for (const bodyModel of responseBodyModels) {
      yield itt`
        case ${JSON.stringify(bodyModel.contentType)}: {
          ${generateContentReturnStatement(bodyModel)}
        }
      `;
    }

    yield itt`
      default:
        throw "cannot happen";
      `;
  }

  function* generateContentReturnStatement(responseBodyModel: skiffaCore.BodyContainer | null) {
    const tuple = new Array<string>();

    if (hasStatusReturn) {
      tuple.push("result.status");
    }

    if (hasParametersReturn) {
      tuple.push(`result.parameters`);
    }

    if (hasContentTypeReturn) {
      tuple.push(`result.contentType`);
    }

    if (hasEntityReturn) {
      tuple.push(
        responseBodyModel == null
          ? "undefined"
          : generateContentEntityExpression(responseBodyModel),
      );
    }

    switch (tuple.length) {
      case 0:
        yield "return;";
        break;

      case 1:
        const [element] = tuple;
        yield `return (${element});`;
        break;

      default:
        yield `return [
          ${tuple.map((element) => `${element},\n`).join("")}
        ]`;
        break;
    }
  }
}

function generateContentEntityExpression(responseBodyModel: skiffaCore.BodyContainer) {
  switch (responseBodyModel.contentType) {
    case "application/x-ndjson":
      return `
        result.entities
      `;

    case "application/json":
      return `
        result.entity()
      `;

    case "text/plain":
      return `
        result.value()
      `;

    default:
      return `
        result.stream()
      `;
  }
}
