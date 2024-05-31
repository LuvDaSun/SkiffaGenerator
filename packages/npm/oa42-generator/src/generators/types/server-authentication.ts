import * as models from "../../models/index.js";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getAuthenticationMemberName, getServerAuthenticationTypeName } from "../names/index.js";

export function* generateServerAuthenticationType(apiModelLegacy: models.Api) {
  const typeName = getServerAuthenticationTypeName();
  const authenticationModels = apiModelLegacy.authentication;

  const typeArgument =
    authenticationModels.length > 0
      ? joinIterable(
          authenticationModels.map((authenticationModel) =>
            JSON.stringify(getAuthenticationMemberName(authenticationModel)),
          ),
          "|",
        )
      : "never";

  yield itt`
    export type ${typeName} = Record<${typeArgument}, unknown>;
  `;
}
