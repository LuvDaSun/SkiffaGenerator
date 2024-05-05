import * as models from "../../models/index.js";
import { itt } from "../../utils/index.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationHandlerTypeName,
  getRegisterAuthenticationHandlerName,
} from "../names/index.js";

export function* registerAuthenticationHandlerMethod(authenticationModel: models.Authentication) {
  const registerHandlerMethodName = getRegisterAuthenticationHandlerName(authenticationModel);
  const handlerTypeName = getAuthenticationHandlerTypeName(authenticationModel);
  const handlerPropertyName = getAuthenticationHandlerName(authenticationModel);

  yield itt`
    private ${handlerPropertyName}?: ${handlerTypeName}<A>;
  `;

  // TODO add function to register all authentication handlers
  yield itt`
    public ${registerHandlerMethodName}(authenticationHandler: ${handlerTypeName}<A>) {
      this.${handlerPropertyName} =
        lib.wrapAsync(
          authenticationHandler,
          this.authenticationWrapper,
          ${JSON.stringify(authenticationModel.name)},
        );
    }
  `;
}
