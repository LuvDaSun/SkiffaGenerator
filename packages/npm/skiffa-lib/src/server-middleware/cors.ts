import { second } from "msecs";
import { ServerMiddleware, ServerOutgoingResponse } from "../server.js";
import { methods } from "../utils.js";

export interface CorsMiddlewareConfiguration {
  /**
   * maximum age in milliseconds
   */
  maxAge: number;
  /**
   * allowed origins
   */
  allowOrigin: string;
}

export function createCorsMiddleware(configuration: CorsMiddlewareConfiguration): ServerMiddleware {
  const { allowOrigin, maxAge } = configuration;

  return async function corsMiddleware(request, next) {
    if (request.method === "OPTIONS") {
      const response: ServerOutgoingResponse = {
        status: 204,
        headers: {
          "access-control-allow-origin": allowOrigin,
          "access-control-max-age": (maxAge / second).toFixed(0),
          "access-control-allow-methods": methods.join(", "),
          "access-control-allow-headers": "*",
          "access-control-expose-headers": "*",
        },
      };
      return response;
    } else {
      const response = await next(request);
      response.headers["access-control-allow-origin"] = allowOrigin;
      return response;
    }
  };
}
