import * as path from "path";
import ts from "typescript";
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
        })
        .option("package-directory", {
          description: "where to output the package",
          type: "string",
        })
        .option("package-name", {
          description: "name of the package",
          type: "string",
        })
        .option("package-version", {
          description: "version of the package",
          type: "string",
        })
        .option("root-name-part", {
          description: "root name of the schema",
          type: "string",
          default: "schema",
        }),
    (argv) => main(argv as MainOptions),
  );
}

interface MainOptions {
  specificationUrl: string;
  packageDirectory: string;
  packageName: string;
  packageVersion: string;
  rootNamePart: string;
}

async function main(options: MainOptions) {
  // read from options

  let specificationUrl: URL;
  if (/^\w+\:\/\//.test(options.specificationUrl)) {
    specificationUrl = new URL(options.specificationUrl);
  } else {
    specificationUrl = new URL(
      "file://" + path.resolve(process.cwd(), options.specificationUrl),
    );
  }
  const packageDirectoryPath = path.resolve(options.packageDirectory);
  const { packageName, packageVersion, rootNamePart } = options;

  // setup document context

  const documentContext = new DocumentContext({
    rootNamePart: options.rootNamePart,
  });
  documentContext.registerFactory(swagger2.factory);
  documentContext.registerFactory(oas30.factory);
  documentContext.registerFactory(oas31.factory);

  // load api model

  await documentContext.loadFromUrl(specificationUrl);

  const apiModel = await documentContext.getApiModel();

  // generate code

  await generatePackage(ts.factory, apiModel, {
    directoryPath: packageDirectoryPath,
    name: packageName,
    version: packageVersion,
  });
}
