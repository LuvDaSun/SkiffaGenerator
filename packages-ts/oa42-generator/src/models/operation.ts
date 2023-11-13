import { Method } from "@oa42/oa42-lib";
import { AuthenticationRequirement } from "./authentication-requirement.js";
import { Body } from "./body.js";
import { OperationResult } from "./operation-result.js";
import { Parameter } from "./parameter.js";

export interface Operation {
  uri: URL;
  method: Method;
  name: string;
  /**
   * all authentications from the second level should pass, any authentications
   * of the first level should pass
   */
  authenticationRequirements: AuthenticationRequirement[][];
  queryParameters: Parameter[];
  headerParameters: Parameter[];
  pathParameters: Parameter[];
  cookieParameters: Parameter[];
  bodies: Body[];
  operationResults: OperationResult[];
}
