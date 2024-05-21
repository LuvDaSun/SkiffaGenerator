import * as core from "@oa42/core";
import assert from "assert";
import * as path from "path";
import * as yargs from "yargs";
import { DocumentContext } from "../documents/document-context.js";
import * as oas30 from "../documents/oas30/index.js";
import * as oas31 from "../documents/oas31/index.js";
import * as swagger2 from "../documents/swagger2/index.js";
import { generatePackage } from "../generators/index.js";

export function configurePackageProgram(argv: yargs.Argv) {
  return argv.command(
    "package [specification-url]",
    "create package from specification-url",
    (yargs) =>
      yargs
        .positional("specification-url", {
          description: "url to download specification from",
          type: "string",
          demandOption: true,
        })
        .option("package-directory", {
          description: "where to output the package",
          type: "string",
          demandOption: true,
        })
        .option("package-name", {
          description: "name of the package",
          type: "string",
          demandOption: true,
        })
        .option("package-version", {
          description: "version of the package",
          type: "string",
          demandOption: true,
        })
        .option("default-type-name", {
          description: "default name for types",
          type: "string",
          default: "schema",
        })
        .option("name-maximum-iterations", {
          description: "maximum number of iterations for finding unique names",
          type: "number",
          default: 5,
        })
        .option("transform-maximum-iterations", {
          description: "maximum number of iterations for transforming",
          type: "number",
          default: 1000,
        })
        .option("request-types", {
          description: "Preferred request content-types",
          type: "string",
          array: true,
          default: ["application/json", "multipart/form-data", "text/plain"],
        })
        .option("response-types", {
          description: "Preferred response content-types",
          type: "string",
          array: true,
          default: ["application/json", "multipart/form-data", "text/plain"],
        }),
    (argv) => main(argv),
  );
}

interface MainOptions {
  specificationUrl: string;
  packageDirectory: string;
  packageName: string;
  packageVersion: string;
  defaultTypeName: string;
  nameMaximumIterations: number;
  transformMaximumIterations: number;
  requestTypes: string[];
  responseTypes: string[];
}

async function main(options: MainOptions) {
  // read from options

  let specificationLocation = options.specificationUrl;
  const packageDirectoryPath = path.resolve(options.packageDirectory);
  const {
    packageName,
    packageVersion,
    defaultTypeName,
    nameMaximumIterations,
    transformMaximumIterations,
    requestTypes,
    responseTypes,
  } = options;

  // setup document context

  const nodeCache = new core.NodeCache();
  const documentContext = new core.DocumentContextContainer(nodeCache);
  documentContext.registerWellKnownFactories();

  await documentContext.loadFromLocation(core.NodeLocation.parse(specificationLocation));

  const apiModel = documentContext.getApiModel(core.NodeLocation.parse(specificationLocation));
  assert(apiModel != null);

  using documentContextLegacy = new DocumentContext({
    defaultTypeName,
    nameMaximumIterations,
    transformMaximumIterations,
    requestTypes,
    responseTypes,
  });
  documentContextLegacy.registerFactory(swagger2.factory);
  documentContextLegacy.registerFactory(oas30.factory);
  documentContextLegacy.registerFactory(oas31.factory);

  // load api model

  await documentContextLegacy.loadFromLocation(specificationLocation);

  const apiModelLegacy = documentContextLegacy.getApiModel();
  const specification = documentContextLegacy.getSpecification();

  // generate code

  generatePackage(apiModelLegacy, apiModel, specification, {
    packageDirectoryPath,
    packageName,
    packageVersion,
  });
}
