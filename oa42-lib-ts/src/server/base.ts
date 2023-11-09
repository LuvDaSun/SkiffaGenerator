import assert from "assert";
import * as http from "http";
import * as http2 from "http2";
import { Readable, Writable, finished } from "stream";
import { Promisable } from "type-fest";
import { Parameters, StatusCode } from "../utils/index.js";

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

export interface RequestListenerOptions {
  onError?: (error: unknown) => void;
}

export abstract class ServerBase {
  protected abstract routeHandler(
    incomingRequest: ServerIncomingRequest,
  ): Promisable<ServerOutgoingResponse>;

  public asRequestListener(
    options: RequestListenerOptions = {},
  ): (
    request: (http.IncomingMessage | http2.Http2ServerRequest) & Readable,
    response: (http.ServerResponse | http2.Http2ServerResponse) & Writable,
  ) => void {
    return (request, response) => {
      const abortController = new AbortController();

      /*
       * Not sure if the aborted event is fired when there is a connection
       * error! if we use finish we can be sure that as soon the response
       * finished the abort is signalled
       *
       * One version that uses the aborted event seemed leaky. This might
       * be the cause of the leak!
       */
      // request.addListener("aborted", () => abortController.abort());
      finished(response, (error) => abortController.abort());
      /*
       */

      const task = async () => {
        assert(request.url != null);
        assert(request.method != null);

        /*
         * split off querystring
         */
        const urlMatch = /^(.*?)(\?.*)?$/g.exec(request.url);
        assert(urlMatch != null);

        const incomingRequest = {
          path: urlMatch[1] ?? "",
          query: urlMatch[2] ?? "",
          method: request.method.toUpperCase(),
          headers: request.headers as Parameters,
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

        const outgoingResponse = await this.routeHandler(incomingRequest);

        response.statusCode = outgoingResponse.status;
        for (const [headerName, headerValue] of Object.entries(
          outgoingResponse.headers,
        )) {
          response.setHeader(headerName, headerValue);
        }
        if ("flushHeaders" in response) {
          response.flushHeaders();
        }

        if (outgoingResponse.stream != null) {
          for await (const chunk of outgoingResponse.stream(
            abortController.signal,
          )) {
            await new Promise<void>((resolve, reject) =>
              response.write(chunk, (error) =>
                error ? reject(error) : resolve(),
              ),
            );
          }
        }
        await new Promise<void>((resolve) => response.end(() => resolve()));
      };

      task().catch(async (error) => {
        options.onError?.(error);
        response.destroy(error);
      });
    };
  }
}
