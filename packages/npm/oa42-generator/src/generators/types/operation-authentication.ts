import * as core from "@oa42/core";
import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getAuthenticationMemberName,
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateOperationAuthenticationType(
  apiModelLegacy: models.Api,
  operationModel: core.OperationContainer,
) {
  const operationAuthenticationName = getOperationAuthenticationTypeName(operationModel);
  const serverAuthenticationName = getServerAuthenticationTypeName();
  const authenticationMap = Object.fromEntries(
    apiModelLegacy.authentication.map((model) => [model.name, model]),
  );

  yield itt`
    export type ${operationAuthenticationName}<A extends ${serverAuthenticationName}> = 
      ${body()}
    ;
  `;

  function* body() {
    yield joinIterable(generateUnionTypes(operationModel.authenticationRequirements), "|\n");
  }

  function* generateUnionTypes(groups: core.AuthenticationRequirementGroupContainer[]) {
    if (groups.length === 0) {
      yield JSON.stringify({});
    }

    for (const group of groups) {
      yield itt`Pick<A, ${joinIterable(generatePickUnionTypes(group.requirements), " | ")}>`;
    }
  }

  function* generatePickUnionTypes(subRequirements: models.AuthenticationRequirement[]) {
    if (subRequirements.length === 0) {
      yield JSON.stringify({});
    }

    for (const requirement of subRequirements) {
      const authenticationModel = authenticationMap[requirement.authenticationName];
      const memberName = getAuthenticationMemberName(authenticationModel);
      yield JSON.stringify(memberName);
    }
  }
}
