import fs from "fs";
import * as jns42generator from "jns42-generator";
import path from "path";
import * as models from "../models/index.js";
import { NestedText, flattenNestedText, splitIterableText } from "../utils/index.js";
import { GeneratorConfiguration } from "./configuration.js";
import { generateBrowserTsCode } from "./files/browser-ts.js";
import { generateClientServerTestTsCode } from "./files/client-server-test-ts.js";
import { generateClientTsCode } from "./files/client-ts.js";
import { generateMainTsCode } from "./files/main-ts.js";
import { generatePackageJsonData } from "./files/package-json.js";
import { generateParametersTsCode } from "./files/parameters-ts.js";
import { generateServerTsCode } from "./files/server-ts.js";
import { generateSharedTsCode } from "./files/shared-ts.js";
import { generateTsconfigJsonData } from "./files/tsconfig-json.js";

export interface PackageConfiguration {
  packageName: string;
  packageVersion: string;
  packageDirectoryPath: string;
}

export function generatePackage(
  apiModel: models.Api,
  specification: jns42generator.Specification,
  packageConfiguration: PackageConfiguration,
  generatorConfiguration: GeneratorConfiguration,
) {
  const { packageDirectoryPath, packageName, packageVersion } = packageConfiguration;

  fs.mkdirSync(packageDirectoryPath, { recursive: true });
  fs.mkdirSync(path.join(packageDirectoryPath, "src"), { recursive: true });

  {
    const data = generatePackageJsonData(packageName, packageVersion);
    const filePath = path.join(packageDirectoryPath, "package.json");
    fs.writeFileSync(filePath, JSON.stringify(data, undefined, 2));
  }

  {
    const data = generateTsconfigJsonData();
    const filePath = path.join(packageDirectoryPath, "tsconfig.json");
    fs.writeFileSync(filePath, JSON.stringify(data, undefined, 2));
  }

  {
    const code = generateMainTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "main.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateBrowserTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "browser.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateSharedTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "shared.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateParametersTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "parameters.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateClientTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "client.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateServerTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "server.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = generateClientServerTestTsCode(apiModel, generatorConfiguration);
    const filePath = path.join(packageDirectoryPath, "src", "client-server.test.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateTypesTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "types.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateValidatorsTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "validators.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateParsersTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "parsers.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateMocksTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "mocks.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateExamplesTestTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "examples.test.ts");
    writeCodeToFile(filePath, code);
  }

  {
    const code = jns42generator.generateMocksTestTsCode(specification);
    const filePath = path.join(packageDirectoryPath, "src", "mocks.test.ts");
    writeCodeToFile(filePath, code);
  }
}

function writeCodeToFile(filePath: string, code: NestedText) {
  const fd = fs.openSync(filePath, "w");

  try {
    for (let text of splitIterableText(flattenNestedText(code))) {
      text = text.trim();
      if (text.length === 0) {
        continue;
      }
      text += "\n";
      fs.writeFileSync(fd, text);
    }
  } finally {
    fs.closeSync(fd);
  }
}
