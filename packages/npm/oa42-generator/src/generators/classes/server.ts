import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateEndpointHandlerMethod, generateRequestHandlerMethod } from "../functions/index.js";
import {
  getAuthenticationHandlerName,
  getAuthenticationHandlerTypeName,
  getOperationHandlerName,
  getOperationHandlerTypeName,
  getRegisterAuthenticationHandlerName,
  getRegisterOperationHandlerName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

/**
 * Generated the server class. This is the server that is generated from the
 * specification. It inherits from the `ServerBase` class in `oa42-lib`.
 *
 * The class sets up routing on instantiation, then it's up to the user to
 * register handlers for all operations via the `register...Operation` methods.
 * Also authentication handlers can be registered via `register...Authentication`
 * methods.
 *
 * The handle method redirects `ServerIncomingRequest` to the right route
 * handler. Then the route handler transforms this request into an operation
 * incoming request that the operation handler can take as input. This handler
 * is then executed with the route parameters and the operation incoming request
 * as arguments. The operation handler return an operation outgoing response
 * that is transformed into a `ServerOutgoingResponse` that is the return type
 * of the handle method.
 */
export function* generateServerClass(apiModel: models.Api) {
  const authenticationTypeName = getServerAuthenticationTypeName();

  yield itt`
export class Server<A extends ${authenticationTypeName} = ${authenticationTypeName}>
  extends lib.ServerBase
{
  ${generateBody(apiModel)}
}
`;
}

function* generateBody(apiModel: models.Api) {
  yield itt`
    protected readonly configuration: ServerConfiguration;
    constructor(configuration: Partial<ServerConfiguration> = {}) {
      super();

      this.configuration = {
        ...defaultServerConfiguration,
        ...configuration,
      };
    }
  `;

  // TODO move to functions
  yield itt`
    public registerMiddleware(middleware: lib.ServerMiddleware) {
      const nextMiddleware = this.middleware;
  
      this.middleware =
        lib.wrapAsync(
          async (request, next) => await middleware.call(this, request, async (request) =>
              await nextMiddleware.call(this, request, next)
            ),
            this.middlewareWrapper,
            middleware.name,
          );
    }
  `;

  yield generateRequestHandlerMethod(apiModel);

  for (const authenticationModel of apiModel.authentication) {
    const registerHandlerMethodName = getRegisterAuthenticationHandlerName(authenticationModel);
    const handlerTypeName = getAuthenticationHandlerTypeName(authenticationModel);
    const handlerPropertyName = getAuthenticationHandlerName(authenticationModel);

    yield itt`
      private ${handlerPropertyName}?: ${handlerTypeName}<A>;
    `;

    // TODO add function to register all authentication handlers
    // TODO move to functions
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

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      const handlerPropertyName = getOperationHandlerName(operationModel);
      const handlerTypeName = getOperationHandlerTypeName(operationModel);
      const registerHandlerMethodName = getRegisterOperationHandlerName(operationModel);

      yield itt`
        private ${handlerPropertyName}?: ${handlerTypeName}<A>;
      `;

      // TODO add function to register all operation handlers
      // TODO move to functions
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

      yield generateEndpointHandlerMethod(apiModel, operationModel);
    }
  }
}
