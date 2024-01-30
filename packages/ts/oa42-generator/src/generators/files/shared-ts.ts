import * as models from "../../models/index.js";
import { banner } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { generateOperationAcceptType } from "../types/operation-accept.js";

export function* generateSharedTsCode(
  apiModel: models.Api,
  configuration: {
    requestTypes: string[];
    responseTypes: string[];
  },
) {
  yield banner;

  yield itt`
  `;

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      yield* generateOperationAcceptType(operationModel);
    }
  }
}
