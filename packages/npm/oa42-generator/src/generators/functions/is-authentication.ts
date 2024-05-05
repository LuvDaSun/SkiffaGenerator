import * as models from "../../models/index.js";
import { itt, joinIterable } from "../../utils/index.js";
import {
  getAuthenticationMemberName,
  getIsAuthenticationFunctionName,
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateIsAuthenticationFunction(
  apiModel: models.Api,
  operationModel: models.Operation,
) {
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const isAuthenticationFunctionName = getIsAuthenticationFunctionName(operationModel);
  const authenticationTypeName = getOperationAuthenticationTypeName(operationModel);
  const authenticationMap = Object.fromEntries(
    apiModel.authentication.map((model) => [model.name, model]),
  );

  yield itt`
    export function ${isAuthenticationFunctionName}<A extends ${serverAuthenticationName}>(
      authentication: Partial<${authenticationTypeName}<A>>,
    ): authentication is ${authenticationTypeName}<A> {
      ${body()}
    }
  `;

  function* body() {
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
      const authenticationModel = authenticationMap[requirement.authenticationName];
      const memberName = getAuthenticationMemberName(authenticationModel);
      yield itt`(${JSON.stringify(memberName)} in authentication && authentication.${memberName} != null)`;
    }
  }
}
