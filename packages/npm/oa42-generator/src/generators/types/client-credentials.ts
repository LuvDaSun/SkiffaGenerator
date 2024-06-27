import * as skiffaCore from "@skiffa/core";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getAuthenticationCredentialTypeName,
  getAuthenticationMemberName,
  getCredentialsTypeName,
  getOperationCredentialsTypeName,
} from "../names/index.js";

export function* generateCredentialsType(apiModel: skiffaCore.ApiContainer) {
  const typeName = getCredentialsTypeName();

  yield itt`
    export type ${typeName} = {
      ${body()}
    };
  `;

  function* body() {
    for (const authenticationModel of apiModel.authentication) {
      const memberName = getAuthenticationMemberName(authenticationModel);
      const typeName = getAuthenticationCredentialTypeName(authenticationModel);

      yield `
        ${memberName}?: ${typeName},
      `;
    }
  }
}

export function* generateOperationCredentialsType(
  apiModel: skiffaCore.ApiContainer,
  operationModel: skiffaCore.OperationContainer,
) {
  const operationCredentialsName = getOperationCredentialsTypeName(operationModel);

  yield itt`
    export type ${operationCredentialsName} = {
      ${body()}
    };
  `;

  function* body() {
    const authenticationNames = new Set(
      operationModel.authenticationRequirements.flatMap((group) =>
        group.requirements.map((requirement) => requirement.authenticationName),
      ),
    );
    const authenticationModels = apiModel.authentication.filter((authenticationModel) =>
      authenticationNames.has(authenticationModel.name),
    );

    for (const authenticationModel of authenticationModels) {
      const memberName = getAuthenticationMemberName(authenticationModel);
      const typeName = getAuthenticationCredentialTypeName(authenticationModel);

      yield `
        ${memberName}?: ${typeName},
      `;
    }
  }
}

export function* generateAuthenticationCredentialType(
  authenticationModel: skiffaCore.AuthenticationContainer,
) {
  const typeName = getAuthenticationCredentialTypeName(authenticationModel);

  yield itt`
    export type ${typeName} = ${typeExpression()};
  `;

  function typeExpression() {
    switch (authenticationModel.type) {
      case "apiKey":
        return `string`;

      case "http":
        switch (authenticationModel.scheme) {
          case "basic":
            return `
              {
                id: string,
                secret: string,
              }
            `;

          case "bearer":
            return `string`;

          default:
            return "unknown";
        }

      default:
        return "unknown";
    }
  }
}
