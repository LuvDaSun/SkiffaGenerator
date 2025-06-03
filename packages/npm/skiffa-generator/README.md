# Skiffa generator, TypeScript edition

Skiffa generator is a code generator that takes an OpenApi schema and generates client and server code in TypeScript. The server can be used in a node environment without a lot of boilerplate. The client works in node and the browser. The client and server are fully types and support streaming.

Types and validators are also generated (via [JsonSchema42](https://github.com/LuvDaSun/JsonSchema42)) and automatically applied so you can be sure that the data that you receive is exactly what you specified in the schema.

Tests are generated from the examples in the specification and from mocks that are also generated from the schemas in the specification.

With Skiffa you can take an api like this:

```yaml
openapi: 3.0.0

info:
  title: hw-api
  description: Hello World
  version: 0.1.0

paths:
  /world:
    get:
      operationId: get-world
      summary: get's information from the world
      responses:
        "200":
          description: Ok
          content:
            "application/json":
              schema:
                type: object
                required:
                  - message
                properties:
                  message:
                    type: string
                    minLength: 1
```

And turn it into a (tree shakable!) client that can be used like this:

```ts
import * as api from "hw-api";

const { message } = await api.client.getWorld();

console.log(message);
```

Or, create and run a server like this:

```ts
import * as api from "hw-api";

const server = new api.server.Server();

server.registerGetWorldOperation(async () => {
  return {
    message: "Hello, World!",
  };
});

api.lib.listen(server, { port: 8080 });
```
