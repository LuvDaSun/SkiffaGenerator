import * as models from "../../models/index.js";
import { toCamel, toPascal } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

// TODO redo
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
      ${generateTypeContent(authenticationModels)}
    };
  `;
}

function* generateTypeContent(authenticationModels: Iterable<models.Authentication>) {
  for (const authenticationModel of authenticationModels) {
    switch (authenticationModel.type) {
      case "apiKey":
        yield itt`
          ${toCamel(authenticationModel.name)}?: string,
        `;
        break;

      case "http":
        switch (authenticationModel.scheme) {
          case "basic":
            yield itt`
              ${toCamel(authenticationModel.name)}?: {
                id: string,
                secret: string,
              },
            `;
            break;

          case "bearer":
            yield itt`
              ${toCamel(authenticationModel.name)}?: string,
            `;
            break;

          default: {
            throw "impossible";
          }
        }
        break;

      default: {
        throw "impossible";
      }
    }
  }
}
