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
          default: "@jns42/document",
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

  using documentContext = new DocumentContext({
    defaultTypeName,
    nameMaximumIterations,
    transformMaximumIterations,
    requestTypes,
    responseTypes,
  });
  documentContext.registerFactory(swagger2.factory);
  documentContext.registerFactory(oas30.factory);
  documentContext.registerFactory(oas31.factory);

  // load api model

  await documentContext.loadFromLocation(specificationLocation);

  const apiModel = documentContext.getApiModel();
  const specification = documentContext.getSpecification();

  // generate code

  generatePackage(apiModel, specification, {
    packageDirectoryPath,
    packageName,
    packageVersion,
  });
}
