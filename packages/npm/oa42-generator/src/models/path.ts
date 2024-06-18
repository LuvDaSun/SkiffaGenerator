import { Operation } from "./operation.js";

export interface Path {
  id: number;
  location: string;
  pattern: string;
  operations: Operation[];
}
