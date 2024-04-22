import { NodeLocation } from "@oa42/core";
import { StatusCode } from "oa42-lib";
import { Body } from "./body.js";
import { Parameter } from "./parameter.js";

export interface OperationResult {
  location: NodeLocation;
  description: string;
  statusKind: string;
  statusCodes: StatusCode[];
  headerParameters: Parameter[];
  bodies: Body[];
  mockable: boolean;
}
