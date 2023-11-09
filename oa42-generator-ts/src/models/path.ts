import { Operation } from "./operation.js";

export interface Path {
  id: number;
  uri: URL;
  pattern: string;
  operations: Operation[];
}
