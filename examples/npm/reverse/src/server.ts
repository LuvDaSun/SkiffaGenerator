import * as api from "reverse-api";
import { reverse } from "./reverse.js";
import { waitForSignal } from "./signal.js";

main();

async function main() {
  // create and configure server

  const server = new api.Server();
  server.registerReverseOperation(async (incomingRequest) => {
    const originalText = await incomingRequest.value();
    const reversedText = reverse(originalText);

    return {
      status: 200,
      contentType: "text/plain",
      value: () => reversedText,
    };
  });

  // read the port to listen to from the environment or use the default

  const port = Number(process.env.PORT ?? 8080);

  console.info(`Starting server...`);
  {
    // listen to the specified port and send requests to the server. We are
    // using the `using` syntax here, the server will be disposed (terminated)
    // at the end of the current block.
    await using listener = await api.lib.listen(server, { port });

    console.info(`Server started (${listener.port})`);

    // wait for a user to send a signal and eventually stop listening.
    await waitForSignal("SIGINT", "SIGTERM");

    console.info("Stopping server...");

    // Thanks to the `using` keyword (and a proper implementation of the dispose)
    // the server is terminated here, at the end of this block.
  }
  console.info(`Server stopped`);
}
