import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/index.js";
import { getOperationCredentialsTypeName, getOperationFunctionName } from "../names/index.js";

export function* generateFacadeOperationFunction(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
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

  yield itt`
  /**
    ${jsDoc}
   */
  export async function ${operationFunctionName}(
    parameters: Record<string, unknown>,
    entity: unknown,    
    operationCredentials: ${credentialsName} = {},
    operationConfiguration: ClientConfiguration = {},
  ): Promise<unknown> {
    ${generateBody(names, apiModel, pathModel, operationModel)}
  }
`;
}

function* generateBody(
  names: Record<string, string>,
  apiModel: skiffaCore.ApiContainer,
  pathModel: skiffaCore.PathContainer,
  operationModel: skiffaCore.OperationContainer,
) {
  const operationFunctionName = getOperationFunctionName(operationModel);
  yield itt`
    const result = client.${operationFunctionName}({
      parameters,
      contentType: "application/json",
      entity: () => entity,
    });

    if (result.status < 200) {
      throw new lib.UnexpectedStatusCode(fetchResponse.status)  
    }

    if (result.status >= 300) {
      throw new lib.UnexpectedStatusCode(fetchResponse.status)  
    }

    const resultEntity = await result.entity();
    return resultEntity;
  `;
}
