import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/index.js";
import { selectBodies } from "../helpers.js";
import {
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getOutgoingRequestTypeName,
  getRequestParametersTypeName,
} from "../names/index.js";

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

  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;

  const parametersTypeName = getRequestParametersTypeName(operationModel);

  for (const requestBodyModel of requestBodyModels) {
    const requestEntityTypeName =
      requestBodyModel.schemaId == null ? null : names[requestBodyModel.schemaId];
    yield itt`
      /**
        ${jsDoc}
      */
      export function ${operationFunctionName}(
        ${hasParametersArgument ? `parameters: parameters.${parametersTypeName},` : ""}
        ${hasContentTypeArgument ? `contentType: ${JSON.stringify(requestBodyModel.contentType)},` : ""}
        ${hasEntityArgument ? `entity: ${requestEntityTypeName == null ? "unknown" : `types.${requestEntityTypeName}`},` : ""}
        operationCredentials?: client.${credentialsName},
        operationConfiguration?: client.ClientConfiguration,
      ): Promise<${generateReturnType(names, apiModel, pathModel, operationModel, requestTypes, responseTypes)}>;
    `;
  }

  yield itt`
    /**
      ${jsDoc}
    */
    export async function ${operationFunctionName}(
      ${hasParametersArgument ? `parameters: parameters.${parametersTypeName},` : ""}
      ${hasContentTypeArgument ? `contentType: string,` : ""}
      ${hasEntityArgument ? `entity: unknown,` : ""}
      operationCredentials: client.${credentialsName} = {},
      operationConfiguration: client.ClientConfiguration = {},
    ): Promise<${generateReturnType(names, apiModel, pathModel, operationModel, requestTypes, responseTypes)}> {
      ${generateBody(names, apiModel, pathModel, operationModel, requestTypes, responseTypes)}
    }
  `;
}

function* generateReturnType(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationResultModels = operationModel.operationResults.filter((operationResultModel) =>
    operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );

  let index = 0;

  switch (operationResultModels.length) {
    case 0: {
      // there is no result! This will always result in an error
      if (index > 0) {
        yield " | ";
      }
      yield "never";
      index++;
      break;
    }
    case 1: {
      // default operation result
      const [operationResultModel] = operationResultModels;
      const responseBodyModels = selectBodies(operationResultModel, responseTypes);

      switch (responseBodyModels.length) {
        case 0: {
          // default operation result and no response body
          if (index > 0) {
            yield " | ";
          }
          yield "undefined";
          index++;
          break;
        }
        case 1: {
          // default operation result and default response body
          const [responseBodyModel] = responseBodyModels;
          const responseEntityTypeName =
            responseBodyModel.schemaId == null ? null : names[responseBodyModel.schemaId];
          if (index > 0) {
            yield " | ";
          }
          yield responseEntityTypeName == null ? "unknown" : `types.${responseEntityTypeName}`;
          index++;
          break;
        }
        default: {
          // default operation result and multiple response bodies
          for (const responseBodyModel of responseBodyModels) {
            const responseEntityTypeName =
              responseBodyModel.schemaId == null ? null : names[responseBodyModel.schemaId];
            if (index > 0) {
              yield " | ";
            }
            yield `[
              ${JSON.stringify(responseBodyModel.contentType)},
              ${responseEntityTypeName == null ? "unknown" : `types.${responseEntityTypeName}`},
            ]`;
            index++;
          }
          break;
        }
      }
      break;
    }
    default: {
      // multiple operation results
      for (const operationResultModel of operationResultModels) {
        const responseBodyModels = selectBodies(operationResultModel, responseTypes);

        switch (responseBodyModels.length) {
          case 0: {
            // multiple operation results, no response body
            if (index > 0) {
              yield " | ";
            }
            yield `[
              ${[...operationResultModel.statusCodes]
                .filter((statusCode) => statusCode >= 200 && statusCode < 300)
                .map((value) => JSON.stringify(value))
                .join(" | ")},
                null,
                undefined,
            ]`;
            index++;
            break;
          }
          case 1: {
            // multiple operation results, default response body
            const [responseBodyModel] = responseBodyModels;
            const responseEntityTypeName =
              responseBodyModel.schemaId == null ? null : names[responseBodyModel.schemaId];

            if (index > 0) {
              yield " | ";
            }
            yield `[
              ${[...operationResultModel.statusCodes]
                .filter((statusCode) => statusCode >= 200 && statusCode < 300)
                .map((value) => JSON.stringify(value))
                .join(" | ")},
              ${JSON.stringify(responseBodyModel.contentType)},
              ${responseEntityTypeName == null ? "unknown" : `types.${responseEntityTypeName}`}
            ]`;
            index++;
            break;
          }
          default: {
            // multiple operation results, multiple response bodies
            for (const responseBodyModel of responseBodyModels) {
              const responseEntityTypeName =
                responseBodyModel.schemaId == null ? null : names[responseBodyModel.schemaId];

              if (index > 0) {
                yield " | ";
              }
              yield `[
                ${[...operationResultModel.statusCodes]
                  .filter((statusCode) => statusCode >= 200 && statusCode < 300)
                  .map((value) => JSON.stringify(value))
                  .join(" | ")},
                ${JSON.stringify(responseBodyModel.contentType)},
                ${responseEntityTypeName == null ? "unknown" : `types.${responseEntityTypeName}`},
              ]`;
              index++;
            }
            break;
          }
        }
      }
    }
  }
}

function* generateBody(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
  requestTypes: Array<string>,
  responseTypes: Array<string>,
) {
  const operationFunctionName = getOperationFunctionName(operationModel);

  const requestBodyModels = selectBodies(operationModel, requestTypes);

  const hasParametersArgument =
    operationModel.pathParameters.length > 0 ||
    operationModel.queryParameters.length > 0 ||
    operationModel.headerParameters.length > 0 ||
    operationModel.cookieParameters.length > 0;
  const hasContentTypeArgument = requestBodyModels.length > 1;
  const hasEntityArgument = requestBodyModels.length > 0;

  const defaultRequestBodyModel = requestBodyModels.length === 1 ? requestBodyModels[0] : null;

  const operationOutgoingRequestName = getOutgoingRequestTypeName(operationModel);

  yield itt`
    const result = await client.${operationFunctionName}(
      {
        ${hasParametersArgument ? "parameters" : "parameters: {}"},
        ${hasContentTypeArgument ? "contentType" : `contentType: ${JSON.stringify(defaultRequestBodyModel?.contentType ?? null)}`},
        ${hasEntityArgument ? "entity: () => entity," : ""}
      } as client.${operationOutgoingRequestName},
      operationCredentials,
      operationConfiguration,
    );
  `;

  const operationResultModels = operationModel.operationResults.filter((operationResultModel) =>
    operationResultModel.statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300),
  );

  for (const operationResultModel of operationResultModels) {
    yield itt`
      switch(result.status) {
        ${generateStatusCodesCaseClauses(operationResultModels, responseTypes)}
      }
    `;
  }
}

function* generateStatusCodesCaseClauses(
  operationResultModels: Array<skiffaCore.OperationResultContainer>,
  responseTypes: Array<string>,
) {
  for (const operationResultModel of operationResultModels) {
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
            ${generateStatusCodeCaseBody(operationResultModel, responseTypes)}
            break;
          }
        `;
      }
    }
  }

  yield itt`
    default:
      throw "cannot happen"
  `;
}

function* generateStatusCodeCaseBody(
  operationResultModel: skiffaCore.OperationResultContainer,
  responseTypes: Array<string>,
) {
  const responseBodyModels = selectBodies(operationResultModel, responseTypes);
  yield itt`
    switch(result.contentType) {
      ${generateContentTypesCaseClauses(operationResultModel, responseBodyModels)}
    }
  `;
}

function* generateContentTypesCaseClauses(
  operationResultModel: skiffaCore.OperationResultContainer,
  responseBodyModels: Array<skiffaCore.BodyContainer>,
) {
  for (const bodyModel of responseBodyModels) {
    yield itt`case ${JSON.stringify(bodyModel.contentType)}:`;
    yield itt`
        {
          return (${generateContentEntityExpression(bodyModel)});
        }
      `;
  }

  yield itt`
    default:
      throw new lib.ClientResponseUnexpectedContentType();
    `;
}

function* generateContentEntityExpression(responseBodyModel: skiffaCore.BodyContainer) {
  switch (responseBodyModel.contentType) {
    case "application/json":
      yield itt`
        result.entity()
      `;
      break;

    case "text/plain":
      yield itt`
        result.value()
      `;
      break;

    default:
      yield itt`
        result.stream()
      `;
  }
}
