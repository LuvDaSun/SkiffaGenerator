# Welcome

Welcome to Skiffa. With the Skiffa code generator you can create a package base on an OpenApi specification. The generator generated a client and server code based on the specification so all that is left for the developer is to implement the logic. Generating code means less code, less errors, less maintenance.

Skiffa supports a "specification first" workflow. If this is what you want, Skiffa is definitely for you. If this is not the flow you are looking for then you can still use Skiffa, but there may be better choices available.

In the "specification first" workflow you start with a specification and use this as a single source of truth. Everything is derived from the specification. Documentation can be generated from this specification, and code can be generated from this specification. The specification can be audited or shared. The specification may change, but it is often important that it remains backwards compatible. A public api is a good use case for a specification first approach.

Skiffa aims to generate code in various languages. Currently only TypeScript is supported. In time we expect more languages to be supported. Starting with Rust once the TypeScript implementation is complete. In time there will be support for wire formats other that JSON. JSON is great, but maybe not the most efficient format. We want to support alternative formats without changing the entities shape so we can use http content negotiation so we encode data in the most appropriate format. This means you can always curl your api to get JSON, but at the same time your Rust client will be able to communicate via JSON BinPack.
