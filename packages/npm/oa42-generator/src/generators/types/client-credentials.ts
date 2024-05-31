import * as models from "../../models/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getAuthenticationCredentialTypeName,
  getAuthenticationMemberName,
  getCredentialsTypeName,
  getOperationCredentialsTypeName,
} from "../names/index.js";

export function* generateCredentialsType(apiModelLegacy: models.Api) {
  const typeName = getCredentialsTypeName();

  yield itt`
    export type ${typeName} = {
      ${body()}
    };
  `;

  function* body() {
    for (const authenticationModel of apiModelLegacy.authentication) {
      const memberName = getAuthenticationMemberName(authenticationModel);
      const typeName = getAuthenticationCredentialTypeName(authenticationModel);

      yield `
        ${memberName}?: ${typeName},
      `;
    }
  }
}

export function* generateOperationCredentialsType(
  apiModelLegacy: models.Api,
  operationModel: models.Operation,
) {
  const operationCredentialsName = getOperationCredentialsTypeName(operationModel);

  yield itt`
    export type ${operationCredentialsName} = {
      ${body()}
    };
  `;

  function* body() {
    const authenticationNames = new Set(
      operationModel.authenticationRequirements.flatMap((requirements) =>
        requirements.map((requirement) => requirement.authenticationName),
      ),
    );
    const authenticationModels = apiModelLegacy.authentication.filter((authenticationModel) =>
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

export function* generateAuthenticationCredentialType(authenticationModel: models.Authentication) {
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
