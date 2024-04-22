import { NodeLocation } from "@jns42/core";
import { Operation } from "./operation.js";

export interface Path {
  id: number;
  location: NodeLocation;
  pattern: string;
  operations: Operation[];
}
