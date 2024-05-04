import * as models from "../../models/index.js";
import { joinIterable, toCamel } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import {
  getOperationAuthenticationTypeName,
  getServerAuthenticationTypeName,
} from "../names/index.js";

export function* generateOperationAuthenticationType(operationModel: models.Operation) {
  const operationAuthenticationName = getOperationAuthenticationTypeName(operationModel);
  const serverAuthenticationName = getServerAuthenticationTypeName();

  // TODO redo this (via the authenticationModel)
  yield itt`
    export type ${operationAuthenticationName}<A extends ${serverAuthenticationName}> = 
      ${
        operationModel.authenticationRequirements.length > 0
          ? joinIterable(
              operationModel.authenticationRequirements.map(
                (requirements) =>
                  itt`Pick<A, ${
                    requirements.length > 0
                      ? joinIterable(
                          requirements.map((requirement) =>
                            JSON.stringify(toCamel(requirement.authenticationName)),
                          ),
                          "|",
                        )
                      : "{}"
                  }>`,
              ),
              "|",
            )
          : "{}"
      }
    ;
  `;
}
