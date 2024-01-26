import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toCamel, toPascal } from "../../utils/name.js";

export function* generateOperationCredentialsType(operationModel: models.Operation) {
  const operationCredentialsName = toPascal(operationModel.name, "credentials");

  yield itt`
    export type ${operationCredentialsName} =
      ${joinIterable(generateUnionTypes(operationModel.authenticationRequirements), " |\n")}
    ;
  `;
}

function* generateUnionTypes(requirements: models.AuthenticationRequirement[][]) {
  if (requirements.length === 0) {
    yield itt`{}`;
  }

  for (const subRequirements of requirements) {
    yield itt`
      {
        ${generateTypeBody(subRequirements)}
      }
    `;
  }
}

function* generateTypeBody(subRequirements: models.AuthenticationRequirement[]) {
  for (const requirement of subRequirements) {
    yield itt`${toCamel(requirement.authenticationName)}: string,`;
  }
}
