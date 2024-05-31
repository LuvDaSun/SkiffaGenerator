import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationHandlerTypeName,
  getAuthenticationHandlersTypeName,
  getRegisterAuthenticationHandlerName,
  getRegisterAuthenticationsHandlerName,
} from "../names/index.js";

export function* registerAuthenticationHandlerMethod(authenticationModel: models.Authentication) {
  const registerHandlerMethodName = getRegisterAuthenticationHandlerName(authenticationModel);
  const handlerTypeName = getAuthenticationHandlerTypeName(authenticationModel);
  const handlerPropertyName = getAuthenticationHandlerName(authenticationModel);

  yield itt`
    public ${registerHandlerMethodName}(authenticationHandler: ${handlerTypeName}<A>) {
      this.authenticationHandlers.${handlerPropertyName} =
        lib.wrapAsync(
          authenticationHandler,
          this.wrappers.authentication,
          ${JSON.stringify(authenticationModel.name)},
        );
    }
  `;
}

export function* registerAuthenticationHandlersMethod(apiModelLegacy: models.Api) {
  const methodName = getRegisterAuthenticationsHandlerName();
  const handlersTypeName = getAuthenticationHandlersTypeName();

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
    for (const authenticationModel of apiModelLegacy.authentication) {
      const registerHandlerMethodName = getRegisterAuthenticationHandlerName(authenticationModel);
      const propertyName = getAuthenticationHandlerName(authenticationModel);
      yield itt`
      case ${JSON.stringify(propertyName)}:
        this.${registerHandlerMethodName}(handlers.${propertyName}!);
        break;
    `;
    }

    yield itt`
      default:
        throw new TypeError("unexpected");
    `;
  }
}
