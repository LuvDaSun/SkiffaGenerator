import { NodeLocation } from "jns42-generator";
import { Operation } from "./operation.js";

export interface Path {
  id: number;
  location: NodeLocation;
  pattern: string;
  operations: Operation[];
}
