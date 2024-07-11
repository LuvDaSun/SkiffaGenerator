import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationHandlerTypeName,
  getAuthenticationHandlersTypeName,
  getRegisterAuthenticationHandlerName,
  getRegisterAuthenticationsHandlerName,
} from "../names.js";

export function* registerAuthenticationHandlerMethod(
  authenticationModel: skiffaCore.AuthenticationContainer,
) {
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

export function* registerAuthenticationHandlersMethod(apiModel: skiffaCore.ApiContainer) {
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
    for (const authenticationModel of apiModel.authentication) {
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
