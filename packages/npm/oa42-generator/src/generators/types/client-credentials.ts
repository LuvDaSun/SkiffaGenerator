import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getAuthenticationMemberName, getOperationCredentialsTypeName } from "../names/index.js";

// TODO redo
export function* generateOperationCredentialsType(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const operationCredentialsName = getOperationCredentialsTypeName(operationModel);
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

// TODO redo with actual requirements
function* generateTypeContent(authenticationModels: Iterable<models.Authentication>) {
  for (const authenticationModel of authenticationModels) {
    switch (authenticationModel.type) {
      case "apiKey":
        yield itt`
          ${getAuthenticationMemberName(authenticationModel)}?: string,
        `;
        break;

      case "http":
        switch (authenticationModel.scheme) {
          case "basic":
            yield itt`
              ${getAuthenticationMemberName(authenticationModel)}?: {
                id: string,
                secret: string,
              },
            `;
            break;

          case "bearer":
            yield itt`
              ${getAuthenticationMemberName(authenticationModel)}?: string,
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
