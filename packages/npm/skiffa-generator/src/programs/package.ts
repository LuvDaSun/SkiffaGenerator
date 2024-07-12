import * as jns42Core from "@jns42/core";
import * as jns42Generator from "@jns42/generator";
import * as skiffaCore from "@skiffa/core";
import assert from "assert";
import * as path from "path";
import * as yargs from "yargs";
import { generatePackage } from "../generators.js";

export function configurePackageProgram(argv: yargs.Argv) {
  return argv.command(
    "package [specification-location]",
    "create package from specification location",
    (yargs) =>
      yargs
        .positional("specification-location", {
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
          default: [
            "application/x-ndjson",
            "application/json",
            "multipart/form-data",
            "text/plain",
          ],
        })
        .option("base-url", {
          description: "The default location from where the api is served",
          type: "string",
        }),
    (argv) => main(argv),
  );
}

interface MainOptions {
  specificationLocation: string;
  packageDirectory: string;
  packageName: string;
  packageVersion: string;
  defaultTypeName: string;
  transformMaximumIterations: number;
  requestTypes: string[];
  responseTypes: string[];
  baseUrl?: string;
}

async function main(options: MainOptions) {
  // read from options

  const packageDirectoryPath = path.resolve(options.packageDirectory);
  const baseUrl = options.baseUrl == null ? undefined : new URL(options.baseUrl);
  const {
    specificationLocation,
    packageName,
    packageVersion,
    defaultTypeName,
    transformMaximumIterations,
    requestTypes,
    responseTypes,
  } = options;

  // setup document context

  const jns42Context = new jns42Core.DocumentContextContainer();
  jns42Context.registerWellKnownFactories();

  const skiffaContext = new skiffaCore.DocumentContextContainer();
  skiffaContext.registerWellKnownFactories();

  await skiffaContext.loadFromLocation(specificationLocation);

  const apiModel = skiffaContext.getApiModel(specificationLocation);
  assert(apiModel != null);

  for (const documentSchema of skiffaContext.getSchemas()) {
    await jns42Context.loadFromLocation(
      documentSchema.schemaLocation,
      documentSchema.schemaLocation,
      documentSchema.documentLocation,
      documentSchema.defaultSchemaId,
    );
  }
  const specification = jns42Generator.loadSpecification(jns42Context, {
    defaultTypeName,
    transformMaximumIterations,
  });

  // generate code

  generatePackage(apiModel, specification, {
    packageDirectoryPath,
    packageName,
    packageVersion,
    requestTypes,
    responseTypes,
    baseUrl,
  });
}
