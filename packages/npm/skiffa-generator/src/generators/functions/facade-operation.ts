import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/index.js";
import { selectBodies } from "../helpers.js";
import {
  getOperationCredentialsTypeName,
  getOperationFunctionName,
  getRequestParametersTypeName,
} from "../names/index.js";

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

  const hasParameters =
    operationModel.pathParameters.length > 0 &&
    operationModel.queryParameters.length > 0 &&
    operationModel.headerParameters.length > 0 &&
    operationModel.cookieParameters.length > 0;
  const requestBodyModels = selectBodies(operationModel, requestTypes);
  const hasEntity = requestBodyModels.length > 0;
  const parametersTypeName = getRequestParametersTypeName(operationModel);

  yield itt`
  /**
    ${jsDoc}
   */
  export async function ${operationFunctionName}(
    ${hasParameters ? `requestParameters: parameters.${parametersTypeName},` : ""}
    ${hasEntity ? `entity: unknown,` : ""}
    operationCredentials: client.${credentialsName} = {},
    operationConfiguration: client.ClientConfiguration = {},
  ): Promise<unknown> {
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
  const operationFunctionName = getOperationFunctionName(operationModel);

  const hasParameters =
    operationModel.pathParameters.length > 0 &&
    operationModel.queryParameters.length > 0 &&
    operationModel.headerParameters.length > 0 &&
    operationModel.cookieParameters.length > 0;
  const requestBodyModels = selectBodies(operationModel, requestTypes);
  const hasEntity = requestBodyModels.length > 0;
  const requestEntityContentType = requestBodyModels[0]?.contentType ?? null;

  yield itt`
    const result = await client.${operationFunctionName}({
      parameters: ${hasParameters ? "requestParameters" : "{}"},
      contentType: ${JSON.stringify(requestEntityContentType)},
      ${hasEntity ? "entity: () => entity," : ""}
    });
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
    const statusCodes = [...operationResultModel.statusCodes];
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

    yield itt`
      default:
        throw new lib.UnexpectedStatusCode(result.status)  
    `;
  }
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
          ${generateContentTypeCaseBody(bodyModel)}
          break;
        }
      `;
  }

  yield itt`
    default:
      throw new lib.UnexpectedContentType(result.contentType)  
    `;
}

function* generateContentTypeCaseBody(responseBodyModel: skiffaCore.BodyContainer) {
  yield itt`
    throw "todo";
  `;
}
