# Skiffa

With love from [Scheveningen](https://www.youtube.com/live/DaG5JReOYEw)!

We love our early bird sponsors!

[<img src="assets/nawadi.svg" alt="Nationaal Watersportdiploma" width="100" />](https://www.nationaalwatersportdiploma.nl/)
[<img src="assets/prospero.png" alt="Prospero" width="100" />](https://prosperoapp.com/)
[<img src="assets/token-me.png" alt="TokenMe" width="100" />](https://token-me.com/)
[<img src="assets/husense_logo.svg" alt="Husense" width="100" />](https://www.husense.io/)

## What is it

Skiffa generator is a code generator that takes an OpenApi schema and generates code in many languages. It is able to generate clients and servers, types and validators and even mocks and tests.

Check out the generator for you favorite language

- [TypeScript](./packages/npm/skiffa-generator/REAMDE.md)

## Use cases

Because Skiffa is able to generate both client _and_ server code from an OpenApi schema it may be used for a number of things! Here are a few example use cases

### Client (sdk) generation

Use Skiffa to generate SDK's for your api and distribute them via the language's registry. Your client is able to use your system by simply installing the SDK in the language of their choice. All of this is generated from one single OpenApi specification that is also ues to generate documentation and even the server code.

### Server generation

Generate a server from an OpenApi specification so you can use this specification as a contract. The server will follow the specification so you have complete control over things like backwards compatibility.

### Migration

If you have an existing system that outputs an OpenApi specification and you want to migrate to another programming language, you can use the specification to generate a server in the new language. Now all that is left is to implement the functionality.

Many Skiffa clients do this but first using the generated Skiffa client and pass through every operation from the service that we migrate away from. So initially the server is a proxy. Then the system if migrated on operation at a time.

### Testing

Testing integrations with a third party may be difficult. Skiffa can solve that. Simply create a server from the third party's OpenApi specification and you have a mocked server that is ideal for testing.

### Many more!

There are many more, some very specific use cases, if you have an intersting one. Please let us know!

## Installing

First, install dependencies via `npm install`.

## Building

You probably want to build The project via `npm --workspaces run build`. This is automatically done before testing and packaging.

> instead of using `--workspaces` you can also use `-ws` we will be using the full names as they make more clear what they are doing.

## Testing

Tests should work on node v21 and later! Run all tests via `npm --workspaces test`.

## Publishing

Bump version via `npm --workspaces version patch`. You could also bump a minor or major version.

Then update dependencies via `npm --workspaces update --save`, or do this manually.

The publish everything via `npm --workspaces publish`.

Then commit and push everything to git.
