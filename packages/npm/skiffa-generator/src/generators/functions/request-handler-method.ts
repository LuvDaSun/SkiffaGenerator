import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import { getEndpointHandlerName } from "../names.js";

export function* generateRequestHandlerMethod(apiModel: skiffaCore.ApiContainer) {
  yield itt`
    protected requestHandler(
      serverIncomingRequest: lib.ServerIncomingRequest,
    ): Promise<lib.ServerOutgoingResponse> {
      return this.wrappers.request(async () => {
        ${generateBody(apiModel)}
      });
    }
  `;
}

function* generateBody(apiModel: skiffaCore.ApiContainer) {
  yield itt`
    const [pathId, pathParameters] =
      router.parseRoute(serverIncomingRequest.path);
  `;

  yield itt`
    switch(pathId) {
      ${generatePathCaseClauses(apiModel)}
    }
  `;
}
function* generatePathCaseClauses(apiModel: skiffaCore.ApiContainer) {
  for (const pathModel of apiModel.paths) {
    yield itt`
      case ${JSON.stringify(pathModel.id)}: 
        switch(serverIncomingRequest.method) {
          ${generateOperationCaseClauses(pathModel)}
        }
    `;
  }

  yield itt`
    default:
      throw new lib.NoRouteFound()
  `;
}
function* generateOperationCaseClauses(pathModel: skiffaCore.PathContainer) {
  for (const operationModel of pathModel.operations) {
    const endpointHandlerName = getEndpointHandlerName(operationModel);

    yield itt`
      case ${JSON.stringify(operationModel.method.toUpperCase())}:
        return this.${endpointHandlerName}(
          pathParameters,
          serverIncomingRequest,
        );
    `;
  }

  yield itt`
    default:
      throw new lib.MethodNotSupported()
  `;
}
