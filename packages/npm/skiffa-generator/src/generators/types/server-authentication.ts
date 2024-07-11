import * as skiffaCore from "@skiffa/core";
import { joinIterable } from "../../utils.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getAuthenticationMemberName, getServerAuthenticationTypeName } from "../names.js";

export function* generateServerAuthenticationType(apiModel: skiffaCore.ApiContainer) {
  const typeName = getServerAuthenticationTypeName();
  const authenticationModels = apiModel.authentication;

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
