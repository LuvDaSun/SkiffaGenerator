import { banner } from "@oa42/core";
import * as models from "../../models/index.js";
import { packageInfo } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getOperationAcceptConstName, getOperationAcceptTypeName } from "../names/index.js";

export function* generateSharedTsCode(apiModel: models.Api) {
  yield banner("//", `v${packageInfo.version}`);

  for (const pathModel of apiModel.paths) {
    for (const operationModel of pathModel.operations) {
      const operationAcceptTypeName = getOperationAcceptTypeName(operationModel);
      const operationAcceptConstName = getOperationAcceptConstName(operationModel);

      const operationAccepts = [
        ...new Set(
          operationModel.operationResults.flatMap((operationResultModel) =>
            operationResultModel.bodies.map((bodyModel) => bodyModel.contentType),
          ),
        ),
      ];

      // TODO move to types
      yield itt`
        export type ${operationAcceptTypeName} = ${
          operationAccepts.length > 0
            ? operationAccepts.map((operationAccept) => JSON.stringify(operationAccept)).join(" | ")
            : "never"
        };
      `;

      yield itt`
        export const ${operationAcceptConstName}: ${operationAcceptTypeName}[] = ${JSON.stringify(operationAccepts)};
      `;
    }
  }
}
