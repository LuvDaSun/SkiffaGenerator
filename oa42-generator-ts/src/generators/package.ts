import fs from "fs";
import path from "path";
import ts from "typescript";
import * as models from "../models/index.js";
import { formatCode, formatData } from "../utils/index.js";
import { generateBrowserTsCode } from "./files/browser-ts.js";
import { generateClientTsCode } from "./files/client-ts.js";
import { generateMainTsCode } from "./files/main-ts.js";
import { generatePackageJsonData } from "./files/package-json.js";
import { generateServerTsCode } from "./files/server-ts.js";
import { getSharedTsCode as generateSharedTsCode } from "./files/shared-ts.js";
import { generateTsconfigJsonData } from "./files/tsconfig-json.js";

export interface PackageOptions {
  name: string;
  version: string;
  directoryPath: string;
}

export async function generatePackage(
  factory: ts.NodeFactory,
  apiModel: models.Api,
  options: PackageOptions,
) {
  fs.mkdirSync(options.directoryPath, { recursive: true });

  {
    const data = generatePackageJsonData(options.name, options.version);
    const filePath = path.join(options.directoryPath, "package.json");
    fs.writeFileSync(filePath, formatData(data));
  }

  {
    const data = generateTsconfigJsonData();
    const filePath = path.join(options.directoryPath, "tsconfig.json");
    fs.writeFileSync(filePath, formatData(data));
  }

  {
    const code = generateMainTsCode(apiModel);
    const filePath = path.join(options.directoryPath, "main.ts");
    fs.writeFileSync(filePath, await formatCode(code));
  }

  {
    const code = generateBrowserTsCode(apiModel);
    const filePath = path.join(options.directoryPath, "browser.ts");
    fs.writeFileSync(filePath, await formatCode(code));
  }

  {
    const code = generateSharedTsCode(factory, apiModel);
    const filePath = path.join(options.directoryPath, "shared.ts");
    fs.writeFileSync(filePath, await formatCode(code));
  }

  {
    const code = generateClientTsCode(apiModel);
    const filePath = path.join(options.directoryPath, "client.ts");
    fs.writeFileSync(filePath, await formatCode(code));
  }

  {
    const code = generateServerTsCode(apiModel);
    const filePath = path.join(options.directoryPath, "server.ts");
    fs.writeFileSync(filePath, await formatCode(code));
  }
}
