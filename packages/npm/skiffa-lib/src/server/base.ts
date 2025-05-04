import assert from "assert";
import * as http from "http";
import * as http2 from "http2";
import { Readable, Writable, finished } from "stream";
import { Parameters, StatusCode } from "../utils.js";
import { defaultServerWrappers } from "./wrapper.js";

export interface ServerIncomingRequest {
  path: string;
  query: string;
  method: string;
  headers: Parameters;
  stream(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface ServerOutgoingResponse {
  status: StatusCode;
  headers: Parameters;
  stream?(signal?: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface ServerMiddleware {
  (
    this: ServerBase,
    request: ServerIncomingRequest,
    next: (request: ServerIncomingRequest) => Promise<ServerOutgoingResponse>,
  ): Promise<ServerOutgoingResponse>;
}

export interface ServerBaseConfiguration {
  prefixPath: string;
}
export const defaultServerBaseConfiguration: ServerBaseConfiguration = {
  prefixPath: "/",
};

export abstract class ServerBase {
  protected abstract readonly configuration: ServerBaseConfiguration;

  public wrappers = { ...defaultServerWrappers };

  protected middleware: ServerMiddleware = (request, next) => next(request);

  protected abstract requestHandler(
    incomingRequest: ServerIncomingRequest,
  ): Promise<ServerOutgoingResponse>;

  public asHttpRequestListener(): (
    request: (http.IncomingMessage | http2.Http2ServerRequest) & Readable,
    response: (http.ServerResponse | http2.Http2ServerResponse) & Writable,
  ) => void {
    return (request, response) => {
      const abortController = new AbortController();

      finished(response, (error) => abortController.abort());

      const task = async () => {
        assert(request.url != null);
        assert(request.method != null);

        /*
         * split off querystring
         */
        const urlMatch = /^(.*?)(\?.*)?$/g.exec(request.url);
        assert(urlMatch != null);

        const pathWithPrefix = urlMatch[1] ?? "";
        if (pathWithPrefix.startsWith(this.configuration.prefixPath)) {
          const path = "/" + pathWithPrefix.substring(this.configuration.prefixPath.length);
          const query = urlMatch[2] ?? "";
          const method = request.method.toUpperCase();
          const headers = request.headers as Parameters;

          const incomingRequest = {
            path,
            query,
            method,
            headers,
            stream(signal?: AbortSignal) {
              if (signal != null) {
                /*
                 * aborting the request will drain the request stream
                 */
                const onAbort = () => request.resume();

                signal.addEventListener("abort", onAbort);
                request.addListener("end", () => {
                  signal.removeEventListener("abort", onAbort);
                });
              }

              return request;
            },
          };

          const outgoingResponse = await this.middleware(incomingRequest, (incomingRequest) => {
            return this.requestHandler(incomingRequest);
          });

          response.statusCode = outgoingResponse.status;
          for (const [headerName, headerValue] of Object.entries(outgoingResponse.headers)) {
            response.setHeader(headerName, headerValue);
          }
          if ("flushHeaders" in response) {
            response.flushHeaders();
          }

          if (outgoingResponse.stream != null) {
            for await (const chunk of outgoingResponse.stream(abortController.signal)) {
              await new Promise<void>((resolve, reject) =>
                response.write(chunk, (error) => (error ? reject(error) : resolve())),
              );
            }
          }
        }

        await new Promise<void>((resolve) => response.end(() => resolve()));
      };

      task().then(
        () => {
          response.destroy();
        },
        async (error) => {
          response.destroy(error);
        },
      );
    };
  }
}
