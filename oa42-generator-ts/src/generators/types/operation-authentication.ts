import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { toCamel, toPascal } from "../../utils/name.js";

export function* generateOperationAuthenticationType(
  operationModel: models.Operation,
) {
  const operationAuthenticationName = toPascal(
    operationModel.name,
    "authentication",
  );

  yield itt`
    export type ${operationAuthenticationName}<A extends ServerAuthentication> = 
      ${
        operationModel.authenticationRequirements.length > 0
          ? joinIterable(
              operationModel.authenticationRequirements.map(
                (requirements) =>
                  itt`Pick<A, ${
                    requirements.length > 0
                      ? joinIterable(
                          requirements.map((requirement) =>
                            JSON.stringify(
                              toCamel(requirement.authenticationName),
                            ),
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
