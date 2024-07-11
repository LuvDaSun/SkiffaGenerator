import * as skiffaCore from "@skiffa/core";
import { itt, joinIterable } from "../../utils.js";
import {
  getAuthenticationMemberName,
  getIsAuthenticationFunctionName,
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names.js";

export function* generateIsAuthenticationFunction(
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
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

  function* generateOrRules(groups: skiffaCore.AuthenticationRequirementGroupContainer[]) {
    if (groups.length === 0) {
      yield JSON.stringify(true);
    }

    for (const group of groups) {
      yield joinIterable(generateAndRules(group.requirements), " && ");
    }
  }

  function* generateAndRules(requirements: skiffaCore.AuthenticationRequirementContainer[]) {
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
