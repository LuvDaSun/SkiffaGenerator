import fs from "fs/promises";
import { ServerMiddleware } from "../server/index.js";

// all of this should move to oa42-lib

/**
 * Configure static files to serve, of, when false. Server an empty (204) response.
 */
export interface ServeMiddlewareConfiguration {
  [path: string]:
    | {
        /**
         * Path of the file to serve
         */
        path: string;
        /**
         * content type to serve (for example, text/html or application/javascript)
         */
        contentType: string;
      }
    | false;
}

/**
 * Middleware to serve static files from the file system. Very useful for debugging.
 *
 * @param configuration configuration of the static files to serve
 * @returns middleware
 */
export function createServeMiddleware(
  configuration: ServeMiddlewareConfiguration,
): ServerMiddleware {
  return async function serveMiddleware(request, next) {
    if (request.method === "GET") {
      const pathConfiguration = configuration[request.path];
      if (pathConfiguration === false) {
        return {
          status: 204,
          headers: {},
          async *stream() {},
        };
      }

      if (pathConfiguration != null) {
        return {
          status: 200,
          headers: {
            "content-type": pathConfiguration.contentType,
          },
          async *stream() {
            const data = await fs.readFile(pathConfiguration.path);
            yield data;
          },
        };
      }
    }

    const response = await next(request);
    return response;
  };
}
