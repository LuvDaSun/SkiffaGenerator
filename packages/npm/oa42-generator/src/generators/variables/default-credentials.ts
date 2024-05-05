import { itt } from "../../utils/index.js";
import { getCredentialsConstantName, getCredentialsTypeName } from "../names/index.js";

export function* generateCredentialsConstant() {
  const typeName = getCredentialsTypeName();
  const constantName = getCredentialsConstantName();

  yield itt`
    export const ${constantName}: ${typeName} = {};
  `;
}
