import * as core from "@oa42/core";
import { packageInfo } from "../../utils/index.js";
import { generateOperationAcceptType } from "../types/index.js";
import { generateOperationAcceptConstant } from "../variables/operation-accept.js";

export function* generateSharedTsCode(apiModel: core.ApiContainer) {
  yield core.oa42Banner("//", `v${packageInfo.version}`);

  // for (const authenticationModel of apiModel.authentication) {
  // }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield generateOperationAcceptType(operationModel);
      yield generateOperationAcceptConstant(operationModel);
    }
  }
}
