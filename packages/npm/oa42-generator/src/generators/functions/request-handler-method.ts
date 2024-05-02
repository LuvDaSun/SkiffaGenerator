import * as models from "../../models/index.js";
import { itt, toCamel } from "../../utils/index.js";

export function* generateRequestHandlerMethod(apiModel: models.Api) {
  yield itt`
    protected requestHandler(
      serverIncomingRequest: lib.ServerIncomingRequest,
    ): Promise<lib.ServerOutgoingResponse> {
      return this.requestWrapper(async () => {
        ${generateBody(apiModel)}
      });
    }
  `;
}

function* generateBody(apiModel: models.Api) {
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
function* generatePathCaseClauses(apiModel: models.Api) {
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
function* generateOperationCaseClauses(pathModel: models.Path) {
  for (const operationModel of pathModel.operations) {
    const endpointHandlerName = toCamel(operationModel.name, "endpoint", "handler");

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
