import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { itt, joinIterable } from "../../utils/index.js";
import {
  getAuthenticationMemberName,
  getIsAuthenticationFunctionName,
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateIsAuthenticationFunction(
  apiModel: core.ApiContainer,
  operationModel: core.OperationContainer,
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

  function* generateOrRules(groups: core.AuthenticationRequirementGroupContainer[]) {
    if (groups.length === 0) {
      yield JSON.stringify(true);
    }

    for (const group of groups) {
      yield joinIterable(generateAndRules(group.requirements), " && ");
    }
  }

  function* generateAndRules(requirements: models.AuthenticationRequirement[]) {
    if (requirements.length === 0) {
      yield JSON.stringify(true);
    }

    for (const requirement of requirements) {
      const authenticationModel = authenticationMap[requirement.authenticationName];
      const memberName = getAuthenticationMemberName(authenticationModel);
      yield itt`(${JSON.stringify(memberName)} in authentication && authentication.${memberName} != null)`;
    }
  }
}
