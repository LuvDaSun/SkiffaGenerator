import * as models from "../../models/index.js";
import { joinIterable, toCamel } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";

export function* generateServerAuthenticationType(apiModel: models.Api) {
  const authenticationModels = apiModel.authentication;

  const typeArgument =
    authenticationModels.length > 0
      ? joinIterable(
          authenticationModels.map((authenticationModel) =>
            JSON.stringify(toCamel(authenticationModel.name)),
          ),
          "|",
        )
      : "never";

  yield itt`
    export type ServerAuthentication = Record<${typeArgument}, unknown>;
  `;
}
