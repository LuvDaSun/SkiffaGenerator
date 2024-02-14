import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  generateEndpointHandlerMethodBody,
  generateRequestHandlerMethodBody,
} from "../bodies/index.js";

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
  yield itt`
export class Server<A extends ServerAuthentication = ServerAuthentication>
  extends lib.ServerBase
{
  ${generateServerBody(apiModel)}
}
`;
}

function* generateServerBody(apiModel: models.Api) {
  yield itt`
    protected readonly configuration: ServerConfiguration & typeof defaultServerConfiguration;
    constructor(configuration: Partial<ServerConfiguration> = {}) {
      super();

      this.configuration = {
        ...defaultServerConfiguration,
        ...configuration,
      };
    }
  `;

  yield itt`
    public registerMiddleware(middleware: lib.ServerMiddleware) {
      const nextMiddleware = this.middleware;
  
      this.middleware =
        lib.wrapAsync(
          async (request, next) => await middleware.call(this, request, async (request) =>
              await nextMiddleware.call(this, request, next)
            ),
            this.configuration.middlewareWrapper,
            middleware.name,
          );
    }
  `;

  yield itt`
    protected requestHandler(
      serverIncomingRequest: lib.ServerIncomingRequest,
    ): Promise<lib.ServerOutgoingResponse> {
      return this.configuration.requestWrapper(async () => {
        ${generateRequestHandlerMethodBody(apiModel)}
      });
    }
  `;

  for (const authenticationModel of apiModel.authentication) {
    const registerHandlerMethodName = toCamel(
      "register",
      authenticationModel.name,
      "authentication",
    );
    const handlerTypeName = toPascal(authenticationModel.name, "authentication", "handler");
    const handlerPropertyName = toCamel(authenticationModel.name, "authentication", "handler");

    yield itt`
      private ${handlerPropertyName}?: ${handlerTypeName}<A>;
    `;

    yield itt`
      public ${registerHandlerMethodName}(authenticationHandler: ${handlerTypeName}<A>) {
        this.${handlerPropertyName} =
          lib.wrapAsync(
            authenticationHandler,
            this.configuration.authenticationWrapper,
            ${JSON.stringify(authenticationModel.name)},
          );
      }
    `;
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      const handlerPropertyName = toCamel(operationModel.name, "operation", "handler");
      const handlerTypeName = toPascal(operationModel.name, "operation", "handler");

      const registerHandlerMethodName = toCamel("register", operationModel.name, "operation");

      const endpointHandlerName = toCamel(operationModel.name, "endpoint", "handler");

      yield itt`
        private ${handlerPropertyName}?: ${handlerTypeName}<A>;
      `;

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
              this.configuration.operationWrapper,
              ${JSON.stringify(operationModel.name)},
            );
        }
      `;

      yield itt`
        private ${endpointHandlerName}(
          pathParameters: Record<string, string>,
          serverIncomingRequest: lib.ServerIncomingRequest,
        ): Promise<lib.ServerOutgoingResponse> {
          return this.configuration.endpointWrapper(async () => {
            ${generateEndpointHandlerMethodBody(apiModel, operationModel)}
          });
        }
      `;
    }
  }
}
