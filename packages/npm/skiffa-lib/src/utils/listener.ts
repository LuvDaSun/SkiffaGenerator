import assert from "assert";
import http from "http";
import { ServerBase } from "../server/index.js";

export interface Listener {
  port: number;
  [Symbol.asyncDispose](): Promise<void>;
}

export interface ListenerConfiguration {
  port?: number;
}

export async function listen<S extends ServerBase>(
  server: S,
  configuration: ListenerConfiguration = {},
): Promise<Listener> {
  const { port } = configuration;
  const httpServer = http.createServer();
  const onRequest = server.asHttpRequestListener();

  httpServer.addListener("request", onRequest);
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  const address = httpServer.address();
  assert(address != null);
  assert(typeof address === "object");

  const dispose = async () => {
    httpServer.removeListener("request", onRequest);

    httpServer.closeAllConnections();

    await new Promise<void>((resolve, reject) =>
      httpServer.close((error) => (error == null ? resolve() : reject(error))),
    );
  };

  return {
    port: address?.port,
    [Symbol.asyncDispose]: dispose,
  };
}
