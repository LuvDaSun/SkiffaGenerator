import * as oa42Core from "@oa42/core";
import { joinIterable } from "../../utils/index.js";
import { itt } from "../../utils/iterable-text-template.js";
import { getAuthenticationMemberName, getServerAuthenticationTypeName } from "../names/index.js";

export function* generateServerAuthenticationType(apiModel: oa42Core.ApiContainer) {
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
