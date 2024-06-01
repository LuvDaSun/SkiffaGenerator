import * as jns42Core from "@jns42/core";
import * as oa42Core from "@oa42/core";
import assert from "assert";
import * as jns42Generator from "jns42-generator";
import * as path from "path";
import * as yargs from "yargs";
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
    transformMaximumIterations,
    requestTypes,
    responseTypes,
  } = options;

  // setup document context

  const jns42Context = jns42Core.DocumentContext.new();
  jns42Context.registerWellKnownFactories();

  const oa42Context = new oa42Core.DocumentContextContainer();
  oa42Context.registerWellKnownFactories();

  await oa42Context.loadFromLocation(oa42Core.NodeLocation.parse(specificationLocation));

  const apiModel = oa42Context.getApiModel(oa42Core.NodeLocation.parse(specificationLocation));
  assert(apiModel != null);

  for (const documentSchema of oa42Context.getSchemas()) {
    await jns42Context.loadFromLocation(
      documentSchema.schemaLocation.toString(),
      documentSchema.schemaLocation.toString(),
      documentSchema.documentLocation.toString(),
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
  });
}
