import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import {
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getOperationHandlersTypeName,
  getRegisterOperationHandlerName,
  getRegisterOperationsHandlerName,
} from "../names.js";

export function* registerOperationHandlerMethod(operationModel: skiffaCore.OperationContainer) {
  const handlerPropertyName = getOperationHandlerName(operationModel);
  const handlerTypeName = getOperationHandlerTypeName(operationModel);
  const registerHandlerMethodName = getRegisterOperationHandlerName(operationModel);

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
    public ${registerHandlerMethodName}(operationHandler: ${handlerTypeName}<A>) {
      this.operationHandlers.${handlerPropertyName} =
        lib.wrapAsync(
          operationHandler,
          this.wrappers.operation,
          ${JSON.stringify(operationModel.name)},
        );
    }
  `;
}

export function* registerOperationHandlersMethod(apiModel: skiffaCore.ApiContainer) {
  const methodName = getRegisterOperationsHandlerName();
  const handlersTypeName = getOperationHandlersTypeName();

  yield itt`
    public ${methodName}(handlers: Partial<${handlersTypeName}<A>>) {
      for(const name in handlers) {
        switch(name) {
          ${switchBody()}
        }
      }
    }
  `;

  function* switchBody() {
    for (const pathModel of apiModel.paths) {
      for (const operationModel of pathModel.operations) {
        const registerHandlerMethodName = getRegisterOperationHandlerName(operationModel);
        const propertyName = getOperationHandlerName(operationModel);
        yield itt`
          case ${JSON.stringify(propertyName)}:
            this.${registerHandlerMethodName}(handlers.${propertyName}!);
            break;
        `;
      }
    }

    yield itt`
      default:
        throw new TypeError("unexpected");
    `;
  }
}
