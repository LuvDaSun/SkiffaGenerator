import { banner } from "@oa42/core";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { generateOperationAcceptConstant } from "../constants/operation-accept.js";
import { generateOperationAcceptType } from "../types/index.js";

export function* generateSharedTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield generateOperationAcceptType(operationModel);
      yield generateOperationAcceptConstant(operationModel);
    }
  }
}
