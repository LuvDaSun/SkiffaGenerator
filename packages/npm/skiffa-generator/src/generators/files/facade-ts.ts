import * as skiffaCore from "@skiffa/core";
import { Router } from "goodrouter";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateFacadeOperationFunction } from "../functions/index.js";

export function* generateFacadeTsCode(
  names: Record<string, string>,
  router: Router<number>,
  apiModel: skiffaCore.ApiContainer,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  yield itt`
    import * as lib from "@skiffa/lib";
    import * as client from "./client.js";
  `;

  for (const authenticationModel of apiModel.authentication) {
    //
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateFacadeOperationFunction(names, apiModel, pathModel, operationModel);
    }
  }
}
