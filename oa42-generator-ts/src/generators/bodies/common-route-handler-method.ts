import * as models from "../../models/index.js";
import { toCamel } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateCommonRouteHandlerMethodBody(apiModel: models.Api) {
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
    const routeHandlerName = toCamel(operationModel.name, "route", "handler");

    yield itt`
      case ${JSON.stringify(operationModel.method.toUpperCase())}:
        return this.${routeHandlerName}(
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
