import * as models from "../../models/index.js";
import { itt, joinIterable, toCamel } from "../../utils/index.js";
import {
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateIsAuthenticationFunction(
  pathModel: models.Path,
  operationModel: models.Operation,
) {
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const isAuthenticationFunctionName = toCamel("is", operationModel.name, "authentication");
  const authenticationTypeName = getOperationAuthenticationTypeName(operationModel);

  yield itt`
    export function ${isAuthenticationFunctionName}<A extends ${serverAuthenticationName}>(
      authentication: Partial<${authenticationTypeName}<A>>,
    ): authentication is ${authenticationTypeName}<A> {
      ${generateBody(pathModel, operationModel)}
    }
  `;
}

function* generateBody(pathModel: models.Path, operationModel: models.Operation) {
  yield itt`return ${joinIterable(generateOrRules(operationModel.authenticationRequirements), " ||\n")}`;
  return;
}

function* generateOrRules(requirements: models.AuthenticationRequirement[][]) {
  if (requirements.length === 0) {
    yield JSON.stringify(true);
  }

  for (const subRequirements of requirements) {
    yield joinIterable(generateAndRules(subRequirements), " && ");
  }
}

function* generateAndRules(subRequirements: models.AuthenticationRequirement[]) {
  if (subRequirements.length === 0) {
    yield JSON.stringify(true);
  }

  for (const requirement of subRequirements) {
    yield itt`(${JSON.stringify(toCamel(requirement.authenticationName))} in authentication && authentication.${toCamel(requirement.authenticationName)} !== undefined)`;
  }
}
