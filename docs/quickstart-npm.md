# Quickstart with NPM

Use the OpenApi42 generator to instantly create an NPM package from an OpenApi specification, including a client and a server. Publish this package to NPM or use it in your monorepo from Node.js or your browser.

To get started first you will need an OpenApi schema. Here is one that you could use to get started (taken from the OpenApi42-Examples repository):

```yaml
openapi: 3.0.2

info:
  title: Reverse API
  description: |-
    This API is able to take a string and reverse it. It has only one endpoint! Use this API
    to get started with OpenApi42.
  version: 0.1.0

paths:
  /reverse:
    post:
      operationId: reverse
      description: >
        Reads a string from the request body and returns the reversed value in the body of
        the response.
      requestBody:
        content:
          "text/plain": {}
      responses:
        "200":
          description: Ok
          content:
            "text/plain": {}
```

Put it in a file called `reverse-api.yaml`. Then run the OpenApi42 generator.

```sh
npx oa42-generator reverse-api.yaml --package-directory reverse-api --package-name reverse-api --package-version 0.1.0
```

This will create a package in the `reverse-api` directory. The package has the name `reverse-api` and version `0.1.0`. You could install dependencies of the package via `npm install` and then build the package via `npm run build`. You could publish the package to npm.org (or any other NPM package host) or use the package from your monorepo.

Whatever you do, at some point you will import the package via the following code:

```ts
import * as api from "reverse-api";
```

And now you can work with the generated code. You can create a server:

```ts
const server = new api.Server();
```

And then register a handler for the `reverse` operation:

```ts
server.registerReverseOperation(async (incomingRequest) => {
  const originalText = await incomingRequest.value();
  const characters = [...originalText];
  characters.reverse();
  const reversedText = characters.join("");
  return {
    status: 200,
    contentType: "text/plain",
    value: () => reversedText,
  };
});
```

The arrow function is the handler for the operation. It has an argument, `incomingRequest` that contains everything that you want to know about the request. In our case we want the body of the request, we get is via the `value` method. After reversing the string we want o send it back to the client. We do this by returning an `outgoingResponse` including the status and contentType. The value we want to return is in a function.

> The values in the request and return are wrapped in a function. This is because they are in the http body. The header is received and send first and as soon as we have a header the operation handler is launched. To get the body we need to call the value method. The value will be available just a little later. The value in the response is exactly the opposite. First we send the headers and then, after we sent those we call the value function to get and send the value. In some cases we don't want to send or receive the body immediately or maybe we don't want to send or receive the body at all. In that case the value method is never called and no resources are wasted on it. This is especially important when streaming data via the api.

Now all we need to do is start the server and we can make some requests to it:

```ts
const listener = await api.lib.listen(server, { port: 8080 });
```

The server is now available on port 8080. Curl it like this:

```sh
curl localhost:8080/reverse --header "content-type: text/plain" --data elmer
```

This wil print:

```
remle
```

But, as OpenApi42 generator also generates client code we can also use our generated package to call the server. All operations are exposed as functions from the generated code.

> One reason to use functions is that the code is tree shakable. This is especially important when using the generated code in a browser.

If we want to call the api via the generated code we can simply do:

```ts
const baseUrl = new URL("http://localhost:8080");
const result = await api.reverse(
  {
    contentType: "text/plain",
    value: () => "123",
  },
  {},
  { baseUrl },
);
const resultValue = await result.value();

console.log(resultValue);
```

This will print `321`.
