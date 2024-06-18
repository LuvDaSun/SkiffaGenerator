import * as oa42Core from "@oa42/core";
import { itt } from "../../utils/index.js";
import { getEndpointHandlerName } from "../names/index.js";

export function* generateRequestHandlerMethod(apiModel: oa42Core.ApiContainer) {
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

function* generateBody(apiModel: oa42Core.ApiContainer) {
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
function* generatePathCaseClauses(apiModel: oa42Core.ApiContainer) {
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
function* generateOperationCaseClauses(pathModel: oa42Core.PathContainer) {
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
