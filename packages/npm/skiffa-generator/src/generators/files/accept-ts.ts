import * as skiffaCore from "@skiffa/core";
import { packageInfo } from "../../utils.js";
import { generateOperationAcceptType } from "../types.js";
import { generateOperationAcceptConstant } from "../variables/operation-accept.js";

export function* generateAcceptTsCode(
  apiModel: skiffaCore.ApiContainer,
  responseTypes: Array<string>,
) {
  yield skiffaCore.banner("//", `v${packageInfo.version}`);

  // for (const authenticationModel of apiModel.authentication) {
  // }

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield generateOperationAcceptType(operationModel, responseTypes);
      yield generateOperationAcceptConstant(operationModel, responseTypes);
    }
  }
}
