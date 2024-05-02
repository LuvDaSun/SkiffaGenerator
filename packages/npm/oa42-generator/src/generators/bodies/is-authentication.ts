import * as models from "../../models/index.js";
import { itt, joinIterable, toCamel } from "../../utils/index.js";

export function* generateIsAuthenticationFunctionBody(
  pathModel: models.Path,
  operationModel: models.Operation,
) {
  yield itt`return ${joinIterable(generateOrRules(operationModel.authenticationRequirements), " ||\n")}`;
  return;
}

function* generateOrRules(requirements: models.AuthenticationRequirement[][]) {
  if (requirements.length === 0) {
    yield itt`true`;
  }

  for (const subRequirements of requirements) {
    yield joinIterable(generateAndRules(subRequirements), " && ");
  }
}

function* generateAndRules(subRequirements: models.AuthenticationRequirement[]) {
  if (subRequirements.length === 0) {
    yield itt`true`;
  }

  for (const requirement of subRequirements) {
    yield itt`(${JSON.stringify(toCamel(requirement.authenticationName))} in authentication && authentication.${toCamel(requirement.authenticationName)} !== undefined)`;
  }
}
