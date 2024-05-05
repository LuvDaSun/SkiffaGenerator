import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getRegisterOperationHandlerName,
} from "../names/index.js";

export function* registerOperationHandlerMethod(operationModel: models.Operation) {
  const handlerPropertyName = getOperationHandlerName(operationModel);
  const handlerTypeName = getOperationHandlerTypeName(operationModel);
  const registerHandlerMethodName = getRegisterOperationHandlerName(operationModel);

  yield itt`
    private ${handlerPropertyName}?: ${handlerTypeName}<A>;
  `;

  // TODO add function to register all operation handlers
  const jsDoc = [
    operationModel.deprecated ? "@deprecated" : "",
    operationModel.summary,
    operationModel.description,
  ]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  yield itt`
    /**
     ${jsDoc}
     */
    public ${registerHandlerMethodName}(operationHandler: ${handlerTypeName}<A>) {
      this.${handlerPropertyName} =
        lib.wrapAsync(
          operationHandler,
          this.operationWrapper,
          ${JSON.stringify(operationModel.name)},
        );
    }
  `;
}
