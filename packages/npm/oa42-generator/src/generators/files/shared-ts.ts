import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { generateOperationAcceptType } from "../types/index.js";
import { generateOperationAcceptConstant } from "../variables/operation-accept.js";

export function* generateSharedTsCode(apiModel: models.Api, apiModel1: core.ApiContainer) {
  yield core.banner("//", `v${packageInfo.version}`);

  // for (const authenticationModel of apiModel.authentication) {
  // }

  for (const pathModel of apiModel1.paths) {
    for (const operationModel of pathModel.operations) {
      //
    }
  }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield generateOperationAcceptType(operationModel);
      yield generateOperationAcceptConstant(operationModel);
    }
  }
}
