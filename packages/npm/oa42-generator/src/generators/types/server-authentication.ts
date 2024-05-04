import * as models from "../../models/index.js";
import { joinIterable, toCamel } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getServerAuthenticationTypeName } from "../names/index.js";

export function* generateServerAuthenticationType(apiModel: models.Api) {
  const typeName = getServerAuthenticationTypeName();
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
    export type ${typeName} = Record<${typeArgument}, unknown>;
  `;
}
