import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateOperationCredentialsType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationCredentialsName = toPascal(operationModel.name, "credentials");
  const authenticationNames = new Set(
    operationModel.authenticationRequirements.flatMap((requirements) =>
      requirements.map((requirement) => requirement.authenticationName),
    ),
  );
  const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
    authenticationNames.has(authenticationModel.name),
  );

  yield itt`
    export type ${operationCredentialsName} = {
      ${authenticationModels.map(
        (authenticationModel) => itt`
          ${toCamel(authenticationModel.name)}: string,
        `,
      )}
    };
  `;
}
