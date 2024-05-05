import { itt } from "../../utils/index.js";

export function* generateRegisterMiddlewareMethod() {
  yield itt`
  public registerMiddleware(middleware: lib.ServerMiddleware) {
    const nextMiddleware = this.middleware;

    this.middleware =
      lib.wrapAsync(
        async (request, next) => await middleware.call(this, request, async (request) =>
            await nextMiddleware.call(this, request, next)
          ),
          this.wrappers.middleware,
          middleware.name,
        );
  }
`;
}
