## Skiffa core

This project contains all generic code to generate client and server code from OpenApi 3.0 and 3.1 and Swagger 2 standards.

This code is then exposed to TypeScript via Wasm. So we can share the models.

### Design

YAML is loaded as JSON via the `NodeCache` structure. This cache is shared and managed with the `DocumentContext` in this project and also shared with the `DocumentContext` of JsonSchema42. Loading of all documents is done via this cache so we load every document exactly once.

The `DocumentContext` is able to identify what version of the specification we are loading and depending on the version instantiates different `Document` structures that all implement the `DocumentInterface` trait.

Via this trait we can get an `Api` model that describes the api in a generic way.

This model is then passed to the generator that will do the actual code generation. The generator does not have to be written in rust. We expose the `Api` model via wasm so we can use this model in TypeScript.
